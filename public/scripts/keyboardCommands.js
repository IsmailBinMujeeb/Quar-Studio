document.addEventListener("keydown", (e) => {

    if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        toggleInsertTab();
    } else if (e.ctrlKey && e.key == "r") {
        e.preventDefault()
        loadDocuments();
    } else if (e.ctrlKey && e.key == ".") {
        e.preventDefault()
        gotoNextPage();
    } else if (e.ctrlKey && e.key == ",") {
        e.preventDefault()
        gotoPreviousPage();
    }
})