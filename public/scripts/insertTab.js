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
            const field = schema[key];

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

            const input = document.createElement('input');
            input.type = field.type || 'text';
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
