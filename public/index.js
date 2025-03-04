import { getFormData } from "./utility.js";

export async function hit(url, options = {}) {
    const response = await fetch(url, options);
    
    if (!response.ok) {
        const contentType = Object.fromEntries(Array.from(response.headers))?.["content-type"];
        // const data = contentType?.includes("json") ? await response.json() : await response.text();
        const data = await response.clone().text();
        const msg = `${response.status} ${response.statusText} | ${data}`
        console.log(">>", msg);
        message.innerHTML = msg;
        return false;
    }
    
    message.innerHTML = "";
    return response;

}

export function listBooks(e) {
    hit("/books", {
        method: "GET",
        headers: {"Content-Type": "application/json"}
    })
    .then((raw) => raw.json())
    .then((data) => {
        const holder = document.querySelector(".book-list");
        holder.innerHTML = "";
        data.forEach((book) => {
            const linode = document.querySelector("template").content.cloneNode(true);
            linode.querySelector(".highlight > section:first-child").onclick = () => { bookDetails(book._id) };
            linode.querySelector(".tmpl-title").innerHTML = book.title;
            linode.querySelector(".tmpl-author").innerHTML = book.author;
            linode.querySelector(".tmpl-delete").onclick = () => { deleteBook(book._id) }
            linode.querySelector(".tmpl-edit").onclick = () => { editBook(book) }
            holder.appendChild(linode);
        })
    })
}

export function addBook(e) {
    const data = getFormData(e);
    delete data._id;
    hit("/book", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(() => {
        listBooks()
        e.reset();
    })
}

export function updateBook(e) {
    const data = getFormData(e);
    const id = data._id;
    delete data._id;
    hit(`/book/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(() => {
        listBooks()
        e.reset();
    })
}

export function bookDetails(id) {
    hit(`/book/${id}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"}
    })
    .then((raw) => raw.json())
    .then((data) => {
        const form = document.querySelector("form[name=addBookForm]");
        form.reset();
        form.setAttribute("data-mode", "details");
        Object.entries(data).forEach(([kk, vv]) => {
            if (form[kk]) {
                form[kk].value = vv
            }
        });
        setApperance();
    })
}

export function deleteBook(id) {
    hit(`/book/${id}`, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"}
    }).then(() => {
        listBooks()
    })
}

export function loginHandler(e) {
    const data = getFormData(e);
    hit(`/authenticate`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    }).then(() => {
        listBooks();
    })
}

export function logoutHandler() {
    hit(`/logout`, {
        method: "GET",
        headers: {"Content-Type": "application/json"}
    }).then(() => {
        console.log("user loggged out")
    })
}


export function revertBook() {
    const fs = document.querySelector("fieldset:has(form[name=addBookForm])");
    fs.disabled = false;
    const form = document.querySelector("form[name=addBookForm]");
    form.reset();
    form.setAttribute("data-mode", "add");
    setApperance();
}

export function handleBookSection(e) {
    const mode = document.querySelector("form[data-mode]").getAttribute("data-mode");
    if (mode === "add") {
        addBook(e);
    } else if (mode === "edit") {
        updateBook(e);
    }
    listBooks();
}

export function editBook(data) {
    const form = document.querySelector("form[name=addBookForm]");
    form.reset();
    form.setAttribute("data-mode", "edit");
    setApperance();
    Object.entries(data).forEach(([kk, vv]) => {
        if (form[kk]) {
            form[kk].value = vv;
        }
    })
}

export function setApperance() {
    const fs = document.querySelector("fieldset:has(form[name=addBookForm])");
    const mode = fs.querySelector("form").getAttribute("data-mode");
    if (mode === "add") {
        fs.disabled = false;
        fs.querySelector("legend").innerHTML = "Add Book";
        fs.querySelector("input[type=submit]").value = "Add Book";
        fs.querySelector("input[type=submit]").style.visibility = "visible";
        fs.querySelector(".floating-close").style.display = "none";
    } else if (mode === "edit") {
        fs.disabled = false;
        fs.querySelector("legend").innerHTML = "Update Book";
        fs.querySelector("input[type=submit]").value = "Update Book";
        fs.querySelector("input[type=submit]").style.visibility = "visible";
        fs.querySelector(".floating-close").style.display = "block";
    } else if (mode === "details") {
        fs.disabled = true;
        fs.querySelector("legend").innerHTML = "Book Details";
        fs.querySelector("input[type=submit]").style.visibility = "hidden";
        fs.querySelector(".floating-close").style.display = "block";
    }
}
