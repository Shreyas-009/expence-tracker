function changePage(currPage) {
  let pages = document.getElementsByClassName("pages");
  let headerTitle = document.getElementById("header-title");

  for (let page of pages) {
    page.style.display = "none";
  }


  document.getElementById(currPage).style.display = "block";
  headerTitle.textContent = currPage;
}
