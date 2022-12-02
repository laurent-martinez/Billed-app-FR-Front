/**
 * @jest-environment jsdom
 */
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js";
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event"
import router from "../app/Router.js";
import mockstore from "../__mocks__/store";


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //check if dashboard icon is highlighted with the class 'active-icon
      expect(windowIcon.className).toBe("active-icon")
    })
    test("Then bills should be ordered from earliest to latest", () => {
      // sort before the html (to sort also mocked data)
      // bills.sort((a , b) => (a.date < b.date) ? 1 : -1)

      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    describe('When i click on add a new bill', () => {
      test("Then i should be redirected to new bill page",  () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const bill = new Bills({document, onNavigate, mockstore, localStorage})
        const handleClickNewBill  = jest.fn((e) => bill.handleClickNewBill(e))
        const newBillBtn = screen.getByTestId("btn-new-bill")
        newBillBtn.addEventListener("click", handleClickNewBill)
        userEvent.click(newBillBtn)
        expect(handleClickNewBill).toHaveBeenCalled()
        expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
      })
    })
    describe("When i click button action button on a bill", ()=>{
      test("Then the bill should be displayed as a modal", ()=> {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
  
        document.body.innerHTML = BillsUI({ data: bills })
        $.fn.modal = jest.fn();
  
        const bill = new Bills({
          document,
          onNavigate,
          mockstore,
          localStorage
        });
  
        const iconEye = screen.getAllByTestId("icon-eye")
        const handleClickIconEye = jest.fn((icon) =>
          bill.handleClickIconEye(icon)
        )
        iconEye.forEach((icon) => {
          icon.addEventListener("click", (e) => handleClickIconEye(icon))
          userEvent.click(icon)
        })
  
        expect(handleClickIconEye).toHaveBeenCalled()
        expect(screen.getAllByText("Justificatif")).toBeTruthy()
        
      })
    })
  })
  
})
// test d'intégration Get 
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() =>
        expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      );
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockstore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockstore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockstore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});