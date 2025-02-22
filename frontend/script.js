document.addEventListener("DOMContentLoaded", function() {
    const dataGrid = document.getElementById('data-grid');
    const labSelect = document.getElementById('labSelect');
    let allData = [];

    function renderGrid(data) {
        dataGrid.innerHTML = "";
        if (data.length === 0) {
            dataGrid.innerHTML = "<p>No records available.</p>";
            return;
        }
        const header = document.createElement('div');
        header.className = 'grid-header';
        ['Hackerrank ID', 'Name', 'Location', 'Challenge', 'Balloon', ''].forEach(label => {
            const cell = document.createElement('div');
            cell.className = 'grid-header-cell';
            cell.textContent = label;
            header.appendChild(cell);
        });
        dataGrid.appendChild(header);
        const body = document.createElement('div');
        body.className = 'grid-body';
        data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'grid-row';
            const values = [
                { text: item.hacker_id, class: 'text-mono' },
                { text: item.Name, class: 'text-primary' },
                { text: `${item.Lab} ${item.Location}`, class: 'text-secondary' },
                { text: item.challenge, class: 'text-primary' },
                { text: item.colour, class: 'status-badge' }
            ];
            values.forEach(v => {
                const cell = document.createElement('div');
                cell.className = `grid-cell ${v.class}`;
                cell.textContent = v.text;
                row.appendChild(cell);
            });
            const actionCell = document.createElement('div');
            actionCell.className = 'grid-cell action-cell';
            const button = document.createElement('button');
            button.className = 'action-btn delete-action';
            button.innerHTML = '<span class="action-icon">❌</span>';
            button.addEventListener('click', () => {
                fetch("http://127.0.0.1:5000/submissions/tick-submissions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: item.id })
                })
                .then(res => {
                    if (!res.ok) throw new Error("Network response was not ok");
                    return res.json();
                })
                .then(resData => {
                    if (resData.message === "Submission ticked!") {
                        row.remove();
                        loadBalloons();
                    } else {
                        alert("Error: " + resData.message);
                    }
                })
                .catch(err => {
                    console.error("Error ticking submission:", err);
                    alert("Failed to update submission.");
                });
            });
            actionCell.appendChild(button);
            row.appendChild(actionCell);
            body.appendChild(row);
        });
        dataGrid.appendChild(body);
    }

    function applyFilterAndRender() {
        const selected = labSelect.value;
        const filtered = selected === "all" ? allData : allData.filter(item => item.Lab === selected);
        renderGrid(filtered);
    }

    function loadBalloons() {
        fetch("http://127.0.0.1:5000/submissions/check-balloons")
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(data => {
                allData = data || [];
                applyFilterAndRender();
            })
            .catch(err => {
                console.error("Error loading data:", err);
                allData = [];
                renderGrid([]);
            });
    }

    loadBalloons();
    setInterval(loadBalloons, 5000);
    labSelect.addEventListener('change', applyFilterAndRender);

    //file upload s are here
    const participantsFileInput = document.getElementById("participantsFile");
    const participantsUploadBtn = document.getElementById("participantsUploadBtn");
    const questionsFileInput = document.getElementById("questionsFile");
    const questionsUploadBtn = document.getElementById("questionsUploadBtn");

    participantsUploadBtn.addEventListener("click", () => {
        participantsFileInput.click();
    });

    participantsFileInput.addEventListener("change", () => {
        if (participantsFileInput.files.length > 0) {
            const file = participantsFileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
            
            fetch("http://127.0.0.1:5000/submissions/upload-participants", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || data.error);
                participantsFileInput.value = ""; // Reset input(this fixes issue?)
            })
            .catch(err => {
                console.error(err);
                alert("Error uploading file");
            });
        }
    });

    questionsUploadBtn.addEventListener("click", () => {
        questionsFileInput.click();
    });

    questionsFileInput.addEventListener("change", () => {
        if (questionsFileInput.files.length > 0) {
            const file = questionsFileInput.files[0];
            const formData = new FormData();
            formData.append("file", file);
            
            fetch("http://127.0.0.1:5000/submissions/upload-questions", {
                method: "POST",
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                alert(data.message || data.error);
                questionsFileInput.value = ""; // Reset input(same here?)
            })
            .catch(err => {
                console.error(err);
                alert("Error uploading file");
            });
        }
    });
});