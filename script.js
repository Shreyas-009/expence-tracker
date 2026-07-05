const authForm = document.querySelector("#form");
const userName = document.querySelector("#user-name");
const Container = document.querySelector("#table-body");
const ModalTitle = document.querySelector("#Modal-title");
const ModalBtn = document.querySelector("#Modal-btn");
const profileUsername = document.querySelector("#profile-username");
const currencySelect = document.querySelector("#currency-inp");
const searchInp = document.querySelector("#search-input");
const transactionFilter = document.querySelector("#transaction-filter");
const authorizedApp = document.querySelector("#authorized");

let authMode = "login";
let isEdit = false;
let currentCard = null;
let currentUser = null;
let currentCurrency = "₹";
let expenceStore = [];
let expenceChart = null;

function reset() {
  const key = getTransactionKey(getCurrentUsername());
  localStorage.removeItem(key);
  expenceStore = [];
  updateUi();
}

const sidebarToggle = document.querySelector("#menu-toggle");

function setSidebarOpen(isOpen) {
  if (!authorizedApp) {
    return;
  }

  authorizedApp.classList.toggle("sidebar-open", isOpen);

  if (sidebarToggle) {
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
  }
}

function toggleSidebar() {
  setSidebarOpen(!authorizedApp?.classList.contains("sidebar-open"));
}

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUserData() {
  return currentUser;
}

function getCurrentUsername() {
  return currentUser ? currentUser.username : "";
}

function getTransactionKey(username = currentUser) {
  let keyUsername =
    typeof username === "string" ? username : username?.username;
  return `transactions_${keyUsername || ""}`;
}

function formatAmount(amount) {
  return Number(amount || 0).toFixed(2);
}

function setAuthMode(mode) {
  const loginDisc = document.querySelector("#login-disc");
  const registerDisc = document.querySelector("#register-disc");
  const formBtn = document.querySelector("#form-btn");
  const formTitle = document.querySelector("#form-title");

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
  let user = null;

  if (!username || !password) {
    return;
  }

  let users = getUsers();

  if (authMode === "register") {
    if (users.some((user) => user.username === username)) {
      alert("Username already exists");
      return;
    }

    users.push({ username, password, currency: "$" });
    saveUsers(users);
  } else {
    user = users.find(
      (item) => item.username === username && item.password === password,
    );

    if (!user) {
      alert("Invalid username or password");
      return;
    }
  }

  currentUser = {
    username: username,
    currency: user?.currency || "$",
  };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  currentCurrency = currentUser.currency;

  authForm.reset();
  setAuthMode("login");
  checkAuth();
});

function setTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);

  document.querySelectorAll(".theme-icon").forEach((icon) => {
    icon.src = theme === "dark" ? "./icons/moon.svg" : "./icons/sun.svg";
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
  let nextPage = document.getElementById(currPage);

  if (!nextPage) {
    return;
  }

  for (let page of pages) {
    page.style.display = "none";
  }

  let navBtns = document.getElementsByClassName("nav-btns");

  for (let btn of navBtns) {
    btn.classList.remove("active-btn");
  }

  currBtn.classList.add("active-btn");

  nextPage.style.display = "block";
  headerTitle.textContent = currPage === "profile" ? "Settings" : currPage;
  setSidebarOpen(false);

  if (currPage === "profile") {
    updateProfile();
  }
}

function syncCurrencyUi() {
  if (currencySelect) {
    currentCurrency = currencySelect.value || currentCurrency;
  }

  document.querySelectorAll(".currency-symbol").forEach((item) => {
    item.textContent = currentCurrency;
  });

  if (currencySelect) {
    currencySelect.value = currentCurrency;
  }
}

function loadTransactions() {
  let username = getCurrentUsername();

  if (!username) {
    expenceStore = [];
    return;
  }

  expenceStore =
    JSON.parse(localStorage.getItem(getTransactionKey(username))) || [];
}

function saveTransactions() {
  let username = getCurrentUsername();

  if (!username) {
    return;
  }

  localStorage.setItem(
    getTransactionKey(username),
    JSON.stringify(expenceStore),
  );
}

function updateAmounts() {
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
  renderChart(income, expense);
}

function renderChart(income = 0, expense = 0) {
  const chartCanvas = document.querySelector("#myChart");

  if (!chartCanvas) {
    return;
  }

  let ctx = chartCanvas.getContext("2d");

  if (expenceChart) {
    expenceChart.data.datasets[0].data = [income, expense];
    expenceChart.update();
    return;
  }

  expenceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Income", "Expense"],
      datasets: [
        {
          label: "Amount",
          data: [income, expense],
          borderWidth: 1,
          backgroundColor: ["#51ff91", "#dc2626"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function getVisibleTransactions() {
  let searchValue = searchInp ? searchInp.value.trim().toLowerCase() : "";
  let filterValue = transactionFilter ? transactionFilter.value : "all";

  return expenceStore.filter((item) => {
    let matchesSearch =
      !searchValue ||
      item.description.toLowerCase().includes(searchValue) ||
      item.category.toLowerCase().includes(searchValue) ||
      item.date.toLowerCase().includes(searchValue) ||
      item.type.toLowerCase().includes(searchValue);

    let matchesFilter =
      filterValue === "all" || item.type.toLowerCase() === filterValue;

    return matchesSearch && matchesFilter;
  });
}

function checkAuth() {
  let savedUser = localStorage.getItem("currentUser");

  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (error) {
      currentUser = {
        username: savedUser,
        currency: "$",
      };
    }
  } else {
    currentUser = null;
  }

  if (currentUser && currentUser.username) {
    document.getElementById("unauthorized").style.display = "none";
    document.getElementById("authorized").style.display = "flex";
    userName.textContent = currentUser.username;
    currentCurrency = currentUser.currency || "$";
    loadTransactions();
    updateProfile();
    updateAmounts();
    updateUi();
    return;
  }

  document.getElementById("unauthorized").style.display = "flex";
  document.getElementById("authorized").style.display = "none";
  expenceStore = [];
  updateAmounts();
  updateUi();
  renderChart();
}

checkAuth();

if (currencySelect) {
  currencySelect.addEventListener("change", () => {
    currentCurrency = currencySelect.value;
    syncCurrencyUi();
    updateAmounts();
    updateUi();
  });
}

const logoutBtn = document.querySelector("#logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    setSidebarOpen(false);
    localStorage.removeItem("currentUser");
    currentUser = null;
    expenceStore = [];
    checkAuth();
  });
}

if (sidebarToggle) {
  sidebarToggle.addEventListener("click", toggleSidebar);
}

const sidebarOverlay = document.querySelector("#sidebar-overlay");

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", () => setSidebarOpen(false));
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 640) {
    setSidebarOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setSidebarOpen(false);
  }
});

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

function updateUi() {
  if (!Container) {
    return;
  }

  if (!getCurrentUsername()) {
    Container.innerHTML = "";
    return;
  }

  let ui = "";
  let visibleTransactions = getVisibleTransactions();

  saveTransactions();

  visibleTransactions.forEach((item) => {
    let index = expenceStore.indexOf(item);
    ui += `
    <tr>
      <td>${item.date}</td>
      <td><span class="table-description">${item.description}</span></td>
      <td><span class="table-pill">${item.category}</span></td>
      <td class="table-amount ${item.type === "Income" ? "income" : "expense"}"><span class="currency-symbol">${currentCurrency}</span>${formatAmount(item.amount)}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="table-action-btn view" onclick="toggleModal(${index})" aria-label="View transaction">
            <img class="svg-icon action-icon" src="./icons/view.svg" alt="" aria-hidden="true">
          </button>
          <button type="button" class="table-action-btn edit" onclick="editTask(${index})" aria-label="Edit transaction">
            <img class="svg-icon action-icon" src="./icons/edit.svg" alt="" aria-hidden="true">
          </button>
          <button type="button" class="table-action-btn delete" onclick="deleteTask(${index})" aria-label="Delete transaction">
            <img class="svg-icon action-icon" src="./icons/delete.svg" alt="" aria-hidden="true">
          </button>
        </div>
      </td>
    </tr>
    `;
  });

  Container.innerHTML =
    ui ||
    '<tr><td colspan="5"><p class="empty-state">No transactions yet.</p></td></tr>';
  updateAmounts();
}

function updateProfile() {
  if (profileUsername) {
    profileUsername.value = currentUser?.username || "";
  }

  if (currencySelect) {
    currencySelect.value = currentCurrency;
  }
}

function saveProfile() {
  let newUsername = profileUsername
    ? profileUsername.value.trim()
    : getCurrentUsername();
  let newCurrency = currencySelect ? currencySelect.value : currentCurrency;

  if (!newUsername) {
    return;
  }

  let users = getUsers();
  let currentIndex = users.findIndex(
    (item) => item.username === getCurrentUsername(),
  );

  if (currentIndex === -1) {
    return;
  }

  let existingUser = users.find(
    (item) =>
      item.username === newUsername && item.username !== getCurrentUsername(),
  );

  if (existingUser) {
    alert("Username already exists");
    return;
  }

  let oldUsername = getCurrentUsername();
  let oldKey = getTransactionKey(oldUsername);
  let newKey = getTransactionKey(newUsername);

  users[currentIndex].username = newUsername;
  users[currentIndex].currency = newCurrency;

  if (newUsername !== oldUsername) {
    localStorage.setItem(
      newKey,
      localStorage.getItem(oldKey) || JSON.stringify(expenceStore),
    );
    localStorage.removeItem(oldKey);
  }

  saveUsers(users);
  currentUser = {
    username: newUsername,
    currency: newCurrency,
  };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  currentCurrency = newCurrency;
  userName.textContent = newUsername;
  updateProfile();
  syncCurrencyUi();
  updateAmounts();
  updateUi();
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
  updateUi();
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
  updateUi();
}

if (searchInp) {
  searchInp.addEventListener("input", updateUi);
}

if (transactionFilter) {
  transactionFilter.addEventListener("change", updateUi);
}
