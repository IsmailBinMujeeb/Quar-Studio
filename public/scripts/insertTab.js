async function toggleInsertTab() {
    const modelName = content.dataset?.modelName;
    if (!modelName) {
        showModal('error', 'Error Occurred!', 'No model selected.');
        return;
    }

    const insertTab = document.querySelector('.insert-tab');
    insertTab.classList.toggle('active');

    if (insertTab.innerHTML.trim() !== '') return;

    try {
        const res = await fetch(`/schema/${modelName}`);
        if (!res.ok) throw new Error();

        const schema = await res.json();

        const form = document.createElement('form');
        form.id = 'insert-form';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            const checkboxes = e.target.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                data[cb.name] = cb.checked;
            });

            const textareas = e.target.querySelectorAll('textarea');
            textareas.forEach(async tarea => {
                
                data[tarea.name] = JSON.parse(tarea.value)
                
            })

            const res = await fetch(`/insert/${modelName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const error = await res.json();
                showModal('error', 'Error Occurred!', error.error || 'Something went wrong, please try again.');
                return;
            }

            loadDocuments();
        });


        for (const key in schema) {

            if (/\.\$\*$/.test(key)) continue;
            const field = schema[key];
            let inputType = null;

            const label = document.createElement('label');
            label.innerHTML = `${key}:`;
            label.className = 'label';
            label.htmlFor = key;

            if (field.type === 'ObjectId') {
                const idRes = await fetch(`/id/${field.ref}`);
                if (!idRes.ok) {
                    const error = await idRes.json();
                    showModal('error', 'Error Occurred!', error.error || 'Something went wrong, please try again.');
                    return;
                };

                const ids = await idRes.json();
                const select = document.createElement('select');
                select.id = key;
                select.name = key;
                select.className = 'input';

                ids.forEach(id => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.innerText = id;
                    select.appendChild(option);
                });

                form.append(label, select);
                continue;
            }

            if (field.type === 'String') inputType = 'text';
            else if (field.type === 'Number') inputType = 'number';
            else if (field.type === 'Boolean') inputType = 'checkbox';
            else if (field.type === 'Date') inputType = 'date';
            else if (field.type === 'Array' || field.type === "Map" || field.type === "Object" || field.type == "Mixed" || field.type === "Buffer") {
                const input = document.createElement('textarea');

                input.placeholder = field.type;
                input.id = key;
                input.name = key;
                input.className = 'input';
                field.type === "Array" ? input.textContent = "[ ]" : input.textContent = "{ }";
                input.required = isRequired(field.require);
                if (field.default !== undefined) input.value = field.default;

                form.append(label, input);
                continue;
            };

            if (field.enum) {
                const select = document.createElement('select');
                select.id = key;
                select.name = key;
                select.className = 'input';

                field.enum.forEach(id => {
                    const option = document.createElement('option');
                    option.value = id;
                    option.innerText = id;
                    select.appendChild(option);
                });

                form.append(label, select);
                continue;
            }

            const input = document.createElement('input');
            input.type = inputType || 'text';
            input.placeholder = field.type;
            input.id = key;
            input.name = key;
            input.className = 'input';
            input.required = isRequired(field.require);
            if (field.default !== undefined) input.value = field.default;

            form.append(label, input);
        }

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.innerHTML = 'Submit';
        submitBtn.className = 'btn';
        form.appendChild(submitBtn);

        insertTab.appendChild(form);

    } catch (error) {
        showModal('error', 'Error Occurred!', error.message || 'Something went wrong, please try again.');
    }
}

function isRequired(require) {
    return Array.isArray(require) ? require[0] : require;
}
