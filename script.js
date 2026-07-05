const authForm = document.querySelector("#form");
const formTitle = document.querySelector("#form-title");
const loginDisc = document.querySelector("#login-disc");
const registerDisc = document.querySelector("#register-disc");
const formBtn = document.querySelector("#form-btn");
const userName = document.querySelector("#user-name");
const Container = document.querySelector("#expence-table");
const ModalTitle = document.querySelector("#Modal-title");
const ModalBtn = document.querySelector("#Modal-btn");
const currencySelect = document.querySelector("#currency-inp");

let authMode = "login";
let isEdit = false;
let currentCard = null;
let currentUser = localStorage.getItem("currentUser") || "";
let currentCurrency = "$";
let expenceStore = [];

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getTransactionKey(username = currentUser) {
  return `transactions_${username}`;
}

function getCurrencyKey(username = currentUser) {
  return `currency_${username}`;
}

function formatAmount(amount) {
  return Number(amount || 0).toFixed(2);
}

function setAuthMode(mode) {
  authMode = mode;
  let isRegister = mode === "register";

  formTitle.textContent = isRegister ? "Register" : "Login";
  formBtn.textContent = isRegister ? "Register" : "Login";
  loginDisc.style.display = isRegister ? "none" : "block";
  registerDisc.style.display = isRegister ? "block" : "none";
}

function authChange(curr) {
  setAuthMode(curr.textContent.trim() === "Register" ? "register" : "login");
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();

  let username = authForm.elements.namedItem("username").value.trim();
  let password = authForm.elements.namedItem("password").value.trim();

  if (!username || !password) {
    return;
  }

  let users = getUsers();

  if (authMode === "register") {
    if (users.some((user) => user.username === username)) {
      alert("Username already exists");
      return;
    }

    users.push({ username, password });
    saveUsers(users);
  } else {
    let user = users.find(
      (item) => item.username === username && item.password === password,
    );

    if (!user) {
      alert("Invalid username or password");
      return;
    }
  }

  currentUser = username;
  localStorage.setItem("auth", "true");
  localStorage.setItem("currentUser", username);

  if (!localStorage.getItem(getCurrencyKey(username))) {
    localStorage.setItem(getCurrencyKey(username), "$");
  }

  currentCurrency = localStorage.getItem(getCurrencyKey(username)) || "$";

  authForm.reset();
  setAuthMode("login");
  checkAuth();
});

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);

  document.querySelectorAll("#theme-btn").forEach((btn) => {
    btn.textContent = theme === "dark" ? "🌙" : "☀️";
  });
}

function toggleTheme() {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  setTheme(next);
}

setTheme(localStorage.getItem("theme") || "light");

function changePage(currBtn, currPage) {
  let pages = document.getElementsByClassName("pages");
  let headerTitle = document.getElementById("header-title");

  for (let page of pages) {
    page.style.display = "none";
  }

  let navBtns = document.getElementsByClassName("nav-btns");

  for (let btn of navBtns) {
    btn.classList.remove("active-btn");
  }

  currBtn.classList.add("active-btn");

  document.getElementById(currPage).style.display = "block";
  headerTitle.textContent = currPage;
}

function syncCurrencyUi() {
  document.querySelectorAll(".currency-symbol").forEach((item) => {
    item.textContent = currentCurrency;
  });

  if (currencySelect) {
    currencySelect.value = currentCurrency;
  }
}

function loadTransactions() {
  if (!currentUser) {
    expenceStore = [];
    return;
  }

  expenceStore = JSON.parse(localStorage.getItem(getTransactionKey())) || [];
}

function saveTransactions() {
  if (!currentUser) {
    return;
  }

  localStorage.setItem(getTransactionKey(), JSON.stringify(expenceStore));
}

function updateTopCards() {
  let income = 0;
  let expense = 0;

  expenceStore.forEach((item) => {
    let amount = Number(item.amount) || 0;

    if (item.type === "Income") {
      income += amount;
    } else {
      expense += amount;
    }
  });

  let balance = income - expense;

  document.querySelector("#current-balance").textContent =
    formatAmount(balance);
  document.querySelector("#total-income").textContent = formatAmount(income);
  document.querySelector("#total-expense").textContent = formatAmount(expense);
  document.querySelector("#transaction-count").textContent =
    expenceStore.length;
  syncCurrencyUi();
}

function checkAuth() {
  currentUser = localStorage.getItem("currentUser") || "";

  if (currentUser) {
    document.getElementById("unauthorized").style.display = "none";
    document.getElementById("authorized").style.display = "flex";
    userName.textContent = currentUser;
    currentCurrency = localStorage.getItem(getCurrencyKey(currentUser)) || "$";
    loadTransactions();
    updateTopCards();
    renderUi();
    return;
  }

  document.getElementById("unauthorized").style.display = "flex";
  document.getElementById("authorized").style.display = "none";
  expenceStore = [];
  updateTopCards();
  renderUi();
}

checkAuth();

if (currencySelect) {
  currencySelect.addEventListener("change", (event) => {
    currentCurrency = event.target.value;
    localStorage.setItem(getCurrencyKey(), currentCurrency);
    syncCurrencyUi();
    updateTopCards();
    renderUi();
  });
}

const logoutBtn = document.querySelector("#logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("auth");
    currentUser = "";
    expenceStore = [];
    checkAuth();
  });
}

function closeModal() {
  document.querySelector(".Modal").classList.add("hide");

  document.querySelector("#type-inp").value = "Expense";
  document.querySelector("#description-inp").value = "";
  document.querySelector("#amount-inp").value = "";
  document.querySelector("#date-inp").value = "";
  document.querySelector("#category-inp").value = "";

  document.querySelector("#type-inp").disabled = false;
  document.querySelector("#description-inp").disabled = false;
  document.querySelector("#amount-inp").disabled = false;
  document.querySelector("#date-inp").disabled = false;
  document.querySelector("#category-inp").disabled = false;

  isEdit = false;
  currentCard = null;

  ModalTitle.textContent = "Add Transaction";
  ModalBtn.textContent = "Add Transaction";
  ModalBtn.style.display = "block";
}

function toggleModal(index = null) {
  let mType = document.querySelector("#type-inp");
  let mDiscreption = document.querySelector("#description-inp");
  let mAmount = document.querySelector("#amount-inp");
  let mDate = document.querySelector("#date-inp");
  let mCategory = document.querySelector("#category-inp");
  if (index !== null) {
    const task = expenceStore[index];

    mType.disabled = true;
    mDiscreption.disabled = true;
    mAmount.disabled = true;
    mDate.disabled = true;
    mCategory.disabled = true;
    ModalBtn.style.display = "none";

    mType.value = task.type || "Expense";
    mDiscreption.value = task.description || "";
    mAmount.value = task.amount || "";
    mDate.value = task.date || "";
    mCategory.value = task.category;
    ModalTitle.textContent = "View Transaction";
  } else {
    ModalBtn.style.display = "block";
    mType.disabled = false;
    mDiscreption.disabled = false;
    mAmount.disabled = false;
    mDate.disabled = false;
    mCategory.disabled = false;
    ModalTitle.textContent = isEdit ? "Edit Transaction" : "Add Transaction";
    ModalBtn.textContent = isEdit ? "Update Transaction" : "Add Transaction";
  }

  document.querySelector(".Modal").classList.toggle("hide");
}

function renderUi() {
  if (!Container) {
    return;
  }

  if (!currentUser) {
    Container.innerHTML = "";
    return;
  }

  let ui = "";

  saveTransactions();

  expenceStore.forEach((item, index) => {
    ui += `
    <div class="Card">
          <div class="Card-header">
            <h1 class="Card-title">${item.description}</h1>
            <div class="Card-actions">
                <div onclick="editTask(${index})"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil-icon lucide-pencil icon"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></div>
                <div onclick="deleteTask(${index})"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2 icon"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></div>
                <div onclick="toggleModal(${index})"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-icon lucide-eye icon"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg></div>
            </div>
          </div>
          <p class="Card-descreption">
           ${item.description}
          </p>
          <div class="Card-footer">
            <span class="Card-category">${item.type}</span>
            <span class="Card-category">${item.category}</span>
            <span class="Card-category"><span class="currency-symbol">${currentCurrency}</span>${formatAmount(
              item.amount,
            )}</span>
            <span class="Card-category">${item.date}</span>
          </div>
        </div>
    `;
  });

  Container.innerHTML = ui || '<p class="empty-state">No transactions yet.</p>';
  updateTopCards();
}

function addTask() {
  let type = document.querySelector("#type-inp");
  let discreption = document.querySelector("#description-inp");
  let amount = document.querySelector("#amount-inp");
  let date = document.querySelector("#date-inp");
  let category = document.querySelector("#category-inp");

  if (
    !type.value.trim() ||
    !discreption.value.trim() ||
    !amount.value.trim() ||
    !date.value.trim() ||
    !category.value.trim()
  ) {
    return;
  }

  if (isEdit) {
    expenceStore[currentCard].type = type.value.trim();
    expenceStore[currentCard].description = discreption.value.trim();
    expenceStore[currentCard].amount = amount.value.trim();
    expenceStore[currentCard].date = date.value.trim();
    expenceStore[currentCard].category = category.value.trim();

    isEdit = false;
    currentCard = null;
  } else {
    expenceStore.push({
      type: type.value.trim(),
      description: discreption.value.trim(),
      amount: amount.value.trim(),
      date: date.value.trim(),
      category: category.value.trim(),
    });
  }

  type.value = "Expense";
  discreption.value = "";
  amount.value = "";
  date.value = "";
  category.value = "";

  toggleModal();
  renderUi();
}

function editTask(index) {
  const task = expenceStore[index];

  document.querySelector("#type-inp").value = task.type || "Expense";
  document.querySelector("#description-inp").value = task.description || "";
  document.querySelector("#amount-inp").value = task.amount || "";
  document.querySelector("#date-inp").value = task.date || "";
  document.querySelector("#category-inp").value = task.category;

  currentCard = index;
  isEdit = true;

  toggleModal();
}

function deleteTask(index) {
  expenceStore.splice(index, 1);
  renderUi();
}
