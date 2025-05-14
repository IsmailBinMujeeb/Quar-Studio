const tabsContainer = document.getElementById("tabs");
const content = document.getElementById("content");
let currentModelName = "";
let loadedDocuments = [];
const openTabs = {};

function openModel(modelName) {

    if (!openTabs[modelName]) {
        // Create a new tab
        const tab = document.createElement("div");
        tab.className = "tab";
        tab.id = "tab-" + modelName;
        tab.draggable = true;
        tab.innerHTML = modelName + '<span class="close" onclick="closeTab(event, \'' + modelName + '\')">×</span>';
        tab.onclick = () => activateTab(modelName);
        tabsContainer.appendChild(tab);

        tab.addEventListener("dragstart", dragStart);
        tab.addEventListener("dragover", dragOver);
        tab.addEventListener("drop", drop);
        tab.addEventListener("dragend", dragEnd);

        openTabs[modelName] = tab;
    }


    activateTab(modelName);
}

async function activateTab(modelName) {

    // Prevent if tab is already active
    if (content.dataset?.modelName == modelName) return

    content.dataset.modelName = modelName;
    document.getElementById("page-value").innerText = 1;
    document.querySelectorAll(".operations .btn")?.forEach( btn => btn.disabled = false )
    document.querySelector(".operations select").disabled = false;

    const insertTab = document.querySelector('.insert-tab');
    insertTab.classList.remove('active');
    insertTab.innerHTML = "";
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));

    // Set current tab active
    const currentTab = document.getElementById("tab-" + modelName);
    currentTab.classList.add("active");

    // Update content
    await loadDocuments();
}

function closeTab(event, modelName) {
    event.stopPropagation(); // prevent tab click
    const tab = document.getElementById("tab-" + modelName);
    tab.remove();
    delete openTabs[modelName];

    // Clear content if that tab was active and check if other tabs are open to be active
    if (tab.classList.contains("active")) {
        content.innerHTML = "";
        const keys = Object.keys(openTabs);
        const modelName = keys[keys.length - 1] || null;
        if (modelName) activateTab(modelName);
        else disableAllOptions();
    }
}

function disableAllOptions() {
    content.dataset.modelName = '';

    document.querySelectorAll(".operations .btn")?.forEach( btn => btn.disabled = true );
    document.getElementById("document-count").innerText = 0;
    document.querySelector(".operations select").disabled = true;
}

async function loadDocuments() {

    content.innerHTML = "";
    const limit = document.getElementById("limit").value;
    const page = document.getElementById("page-value").innerText;
    const modelName = content.dataset?.modelName;

    if (!modelName) {
        showModal('error', 'Error Occurred!', 'No model selected.');
        return;
    }

    const response = await fetch(`/models/${modelName}?limit=${limit}&page=${page}`);
    if (response.status !== 200) {
        showModal('error', 'Error Occurred!', 'Something went wrong, please try again.');
        return;
    }
    const data = await response.json();

    document.getElementById("document-count").innerText = data.count;
    document.getElementById("page-value").dataset.totalPages = data.totalPages;
    document.getElementById(`${modelName}-doc-count`).innerText = data.totalCount;

    if (Number(page) >= Number(data.totalPages)) document.getElementById("next-page").disabled = true;
    else document.getElementById("next-page").disabled = false;

    if (Number(page) <= 1) document.getElementById("previous-page").disabled = true;
    else document.getElementById("previous-page").disabled = false;

    currentModelName = modelName;
    loadedDocuments = data.documents;
    // Render each array element as its own tree
    data.documents.forEach((doc, index) => {
        const wrapper = document.createElement('div');
        const divDocument = document.createElement('div');
        divDocument.innerHTML += Object.entries(doc).map(([key, value]) => renderData(key, value, index)).join('');

        divDocument.classList.add('document');

        wrapper.appendChild(divDocument);
        wrapper.innerHTML += `<div class="document-actions"><button class="updateDocument" onclick="updateDocument(${index})">Update</button><button class="deleteDocument" onclick="deleteDoc('${modelName}', '${doc._id}')">Delete</button></div>`;

        content.appendChild(wrapper);
    });
}

function toggleEditMode(id) {
    const htmlData = document.getElementById(`${id}-html-data`);
    const jsonData = document.getElementById(`${id}-json-data`);

    htmlData.classList.toggle('hidden');
    jsonData.classList.toggle('hidden');

}

function gotoNextPage() {
    const page = document.getElementById("page-value");
    page.innerText = Number(page.innerText) + 1;

    if (Number(page.innerText) > Number(page.dataset.totalPages)) {
        page.innerText = Number(page.dataset.totalPages);
        return;
    }

    loadDocuments();
}

function gotoPreviousPage() {
    const page = document.getElementById("page-value").innerText;
    document.getElementById("page-value").innerText = Number(page) - 1;

    if (Number(page) - 1 < 1) {
        document.getElementById("page-value").innerText = 1;
        return;
    }

    loadDocuments();
}

function renderData(key, value, index, level = "root.", parentDataType = "object") {
    const type = typeof value;
    if (value === null) return `<div class="field"><span class="data-key">${key}</span>: <span class="null" data-level="${level}" data-index="${index}">null</span><span class="data-type">(null)</span></div>`;

    if (Array.isArray(value)) {
        return `
            <details class="field">
                <summary ><span class="data-key">${key}</span><span class="data-type"> (Array - ${value.length})</span></summary>
                <div class="data-value">
                    ${value.map((v, i) => renderData(`[${i}]`, v, index, level + key, "array")).join('')}
                </div>
            </details>
        `;
    } else if (type === 'object') {
        return `
            <details class="field">
                <summary><span class="data-key">${key}</span><span class="data-type"> (Object)</span></summary>
                <div class="data-value">
                    ${Object.entries(value).map(([k, v]) => renderData(k, v, index, level + key, "object")).join('')}
                </div>
            </details>
        `;
    } else if (typeof value === 'string' && /^[a-f\d]{24}$/i.test(value)) {

        return `<div class="field"><span class="data-key">${key}</span>: <span class="ObjectId">${value}</span></div>`;
    } else {
        return `<div class="field"><span class="data-key">${key}</span>: <span class="${type}" data-level="${level}" data-index="${index}" data-parent-data-type="${parentDataType}" contenteditable >${value}</span></div>`;
    }
}

// Handle collapsibles
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('collapsible')) {
        e.target.classList.toggle("caret-down");
        const nested = e.target.nextElementSibling;
        if (nested) {
            nested.classList.toggle("active");
        }
    }
});

function setNestedValue(obj, path, value, parentDataType) {
    const keys = path.split(".");
    let current = obj;

    keys.forEach((key, index) => {
        if (index === keys.length - 1) {
            const arrayIndexMatch = key.match(/\[(\d+)\]/);
            if (arrayIndexMatch) {
                const idx = parseInt(arrayIndexMatch[1], 10);
                current[idx] = value;
            } else {
                current[key] = value;
            }

        } else {
            if (parentDataType === "array" && !Array.isArray(current[key])) {
                current[key] = [];
            } else if (parentDataType === "object" && typeof current[key] !== "object") {
                current[key] = {};
            }

            current = current[key]; // Go deeper
        }
    });
}

async function updateDocument(index) {

    const confirmUpdate = confirm("Are you sure you want to update this document?");
    if (!confirmUpdate) return;

    const doc = loadedDocuments[index];
    const id = doc._id;

    let updatedDoc = {};
    const values = document.querySelectorAll(`[data-index="${index}"]`);

    values.forEach(el => {
        const key = el.previousElementSibling?.textContent?.trim();
        const level = el.dataset.level;

        if (key) {
            if (level && level !== "root") {
                // Build the full path
                const fullPath = `${level.replace("root.", "")}.${key}`;
                setNestedValue(updatedDoc, fullPath, el.textContent, el.dataset.parentDataType);
            } else {
                updatedDoc[key] = el.textContent;
            }
        }
    });

    updatedDoc = { ...updatedDoc, ...updatedDoc[""] }

    const res = await fetch(`/update/${currentModelName}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoc),
    });

    if (res.ok) {
        showModal('info', 'Document Updated', 'Document updated successfully.');
        loadDocuments();
    } else {
        const data = await res.json();
        showModal('error', 'Update Failed', data.error || 'Update failed, please try again.');
    }
}

async function deleteDoc(modelName, id) {
    const confirmDelete = confirm("Are you sure you want to delete this document?");
    if (!confirmDelete) return;

    const res = await fetch(`/delete/${modelName}/${id}`, {
        method: "DELETE"
    });

    if (res.ok) {
        showModal('info', 'Document Deleted', 'Document deleted successfully.');
        openModel(modelName);
        const data = await res.json();
        document.getElementById(`${modelName}-doc-count`).innerText = data.count || 0;
        loadDocuments()
    } else {
        showModal('error', 'Delete Failed', await res.json().error || 'Delete failed, please try again.');
    }
}

async function deleteAllDocs() {
    try {
        const confirmDelete = confirm("Are you sure you want to delete all documents?");
        if (!confirmDelete) return;

        const modelName = content.dataset?.modelName;
        if (!modelName) {
            showModal('error', 'Error Occurred!', 'No model selected.');
            return;
        }

        const res = await fetch(`/delete-all/${modelName}`, { method: "DELETE" });
        if (res.ok) {
            showModal('info', 'All Documents Deleted', 'All documents deleted successfully.');
            loadDocuments();
        } else {
            showModal('error', 'Delete Failed', await res.json().error || 'Delete failed, please try again.');
        }
    } catch (error) {
        showModal('error', 'Delete Failed', error.message || 'Delete failed, please try again.');
    }
}

function dragStart(e) {
    dragSrc = this;
    e.dataTransfer.effectAllowed = "move";
    this.classList.add("dragging");
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

function drop(e) {
    e.preventDefault();
    if (dragSrc !== this) {
        // Swap positions
        const draggedIndex = Array.from(tabsContainer.children).indexOf(dragSrc);
        const targetIndex = Array.from(tabsContainer.children).indexOf(this);

        if (draggedIndex < targetIndex) {
            tabsContainer.insertBefore(dragSrc, this.nextSibling);
        } else {
            tabsContainer.insertBefore(dragSrc, this);
        }
    }
}

function dragEnd() {
    this.classList.remove("dragging");
}

async function refreshSideBar() {
    try {
        const modelWrapper = document.querySelector('.model-wrapper');

        const res = await fetch("/models");

        if (!res.ok) {
            const error = await res.json();
            showModal('error', 'Error Occurred!', error.error || 'Something went wrong, please try again.');
            return;
        }

        modelWrapper.innerHTML = "";
        const data = await res.json();

        data.models.forEach(model => {
            const modelDiv = document.createElement('div');
            modelDiv.classList.add('model');
            modelDiv.onclick = () => openModel(model.name);
            modelDiv.innerHTML = `${model.name} <span id="${model.name}-doc-count">${model.count}</span>`;
            modelWrapper.appendChild(modelDiv);
        });
    } catch (error) {
        showModal('error', 'Error Occurred!', error.message || 'Something went wrong, please try again.');
    }
}