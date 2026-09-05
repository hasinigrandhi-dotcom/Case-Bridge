const SUPABASE_URL = "https://wbvgmwkzyntiaoswbuev.supabase.co";
const SUPABASE_KEY = "sb_publishable_aWjwp0P9oTstBQEoKUE04Q_7JMIIpHv";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
async function loginCitizen(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (email === "" || password === "") {
        alert("Please enter email and password.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Login failed: " + error.message);
        return;
    }

    window.location.href = "citizen.html";
}
async function registerCitizen(event) {
    event.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (name === "" || email === "" || password === "") {
        alert("Please fill in all fields.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                full_name: name
            }
        }
    });

    if (error) {
        alert("Registration failed: " + error.message);
        return;
    }

    alert("Registration successful! Check your email to verify your account.");
}
async function submitCase(event) {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;
    const incidentDate = document.getElementById("incidentDate").value;

    if (title === "" || description === "" || location === "" || incidentDate === "") {
        alert("Please fill in all fields.");
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Please login first.");
        return;
    }

    const caseNumber = "CB-" + Date.now();

    const { data, error } = await supabaseClient
        .from("cases")
        .insert([
            {
                case_number: caseNumber,
                citizen_id: user.id,
                title: title,
                description: description,
                location: location,
                incident_date: incidentDate
            }
        ]);

    if (error) {
        alert("Case submission failed: " + error.message);
        return;
    }

    alert("Case submitted successfully! Your Case ID is: " + caseNumber);

    document.getElementById("caseForm").reset();
}
async function viewMyCases() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Please login first.");
        return;
    }

    const { data, error } = await supabaseClient
        .from("cases")
        .select("*")
        .eq("citizen_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        alert("Could not load cases: " + error.message);
        return;
    }

    const myCases = document.getElementById("myCases");

    if (data.length === 0) {
        myCases.innerHTML = "<p>No cases submitted yet.</p>";
        return;
    }

    myCases.innerHTML = data.map(caseItem => `
        <div class="feature-card">
            <h3>${caseItem.case_number}</h3>
            <p><strong>Title:</strong> ${caseItem.title}</p>
            <p><strong>Status:</strong> ${caseItem.status}</p>
            <p><strong>Location:</strong> ${caseItem.location}</p>
        </div>
    `).join("");
}
async function loadMyCases() {
    const casesList = document.getElementById("casesList");

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        casesList.innerHTML = "<p>Please login first.</p>";
        return;
    }

    const { data, error } = await supabaseClient
        .from("cases")
        .select("*")
        .eq("citizen_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        casesList.innerHTML = "<p>Unable to load cases: " + error.message + "</p>";
        return;
    }

    if (data.length === 0) {
        casesList.innerHTML = "<p>You have not submitted any cases yet.</p>";
        return;
    }

    casesList.innerHTML = "";

    data.forEach(function(caseItem) {
        casesList.innerHTML += `
            <div class="feature-card">
                <h3>${caseItem.case_number}</h3>
                <p><strong>Title:</strong> ${caseItem.title}</p>
                <p><strong>Status:</strong> ${caseItem.status}</p>
                <p><strong>Location:</strong> ${caseItem.location}</p>
                <p><strong>Incident Date:</strong> ${caseItem.incident_date}</p>
            </div>
        `;
    });
}
async function loadMyCases() {
    const casesList = document.getElementById("casesList");

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        casesList.innerHTML = "<p>Please login first.</p>";
        return;
    }

    const { data, error } = await supabaseClient
        .from("cases")
        .select("*")
        .eq("citizen_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        casesList.innerHTML = "<p>Failed to load cases: " + error.message + "</p>";
        return;
    }

    if (data.length === 0) {
        casesList.innerHTML = "<p>You have not submitted any cases yet.</p>";
        return;
    }

    casesList.innerHTML = "";

    data.forEach(function(caseItem) {
        casesList.innerHTML += `
            <div class="feature-card">
                <h3>${caseItem.title}</h3>
                <p><strong>Case ID:</strong> ${caseItem.case_number}</p>
                <p><strong>Status:</strong> ${caseItem.status}</p>
                <p><strong>Location:</strong> ${caseItem.location}</p>
                <p><strong>Incident Date:</strong> ${caseItem.incident_date}</p>
                <p>${caseItem.description}</p>
             <div id="updates-${caseItem.id}">
                <p>No Updates yet.</p>
            </div>   
            </div>
        `;
        loadCaseUpdates(caseItem.id);
    });
}
async function loadCaseUpdates(caseId) {

    const updatesBox = document.getElementById("updates-" + caseId);

    const { data, error } = await supabaseClient
        .from("case_updates")
        .select("message, status, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

    if (error) {
        console.log("Update error:", error);
        updatesBox.innerHTML = "<p>Unable to load updates.</p>";
        return;
    }

    if (!data || data.length === 0) {
        updatesBox.innerHTML = `
            <h4>Case Timeline</h4>
            <p>No updates yet.</p>
        `;
        return;
    }

    let html = "<h4>Case Timeline</h4>";

    data.forEach(function(update) {

        let statusText = "";

        if (update.status) {
            statusText = update.status
                .replaceAll("_", " ")
                .replace(/\b\w/g, function(letter) {
                    return letter.toUpperCase();
                });
        }

        html += `
            <div class="timeline-item">
                <div class="timeline-dot">●</div>

                <div class="timeline-content">
                    <strong>Police Update</strong>

                    <p>${update.message}</p>

                    ${statusText ? `<p><strong>Status:</strong> ${statusText}</p>` : ""}

                    <small>
                        ${new Date(update.created_at).toLocaleString()}
                    </small>
                </div>
            </div>
        `;
    });

    updatesBox.innerHTML = html;
}
async function logoutCitizen() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Logout failed: " + error.message);
        return;
    }

    window.location.href = "citizen-login.html";
}
async function loginPolice(event) {
    event.preventDefault();

    const email = document.getElementById("policeEmail").value;
    const password = document.getElementById("policePassword").value;

    if (email === "" || password === "") {
        alert("Please enter email and password.");
        return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Police login failed: " + error.message);
        return;
    }

    window.location.href = "police.html";
}
async function loadPoliceCases() {

    const casesList = document.getElementById("policeCasesList");

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        casesList.innerHTML = "<p>Please login first.</p>";
        return;
    }

    const { data, error } = await supabaseClient
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        casesList.innerHTML =
            "<p>Failed to load cases: " + error.message + "</p>";
        return;
    }

    if (data.length === 0) {
        casesList.innerHTML = "<p>No cases have been submitted yet.</p>";
        return;
    }

    casesList.innerHTML = "";

    data.forEach(function(caseItem) {

        casesList.innerHTML += `
            <div class="feature-card">

                <h3>${caseItem.title}</h3>

                <p>
                    <strong>Case ID:</strong>
                    ${caseItem.case_number}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${caseItem.status}
                </p>

                <p>
                    <strong>Priority:</strong>
                    ${caseItem.priority}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${caseItem.location}
                </p>

                <p>
                    <strong>Incident Date:</strong>
                    ${caseItem.incident_date}
                </p>

                <p>${caseItem.description}</p>
                <label>Status</label>

                <select onchange="updateCaseStatus('${caseItem.id}', this.value)">

    <option value="submitted" ${caseItem.status === "submitted" ? "selected" : ""}>
        Submitted
    </option>

    <option value="under_review" ${caseItem.status === "under_review" ? "selected" : ""}>
        Under Review
    </option>

    <option value="assigned" ${caseItem.status === "assigned" ? "selected" : ""}>
        Assigned
    </option>

    <option value="investigation" ${caseItem.status === "investigation" ? "selected" : ""}>
        Investigation
    </option>

    <option value="resolved" ${caseItem.status === "resolved" ? "selected" : ""}>
        Resolved
    </option>

    <option value="closed" ${caseItem.status === "closed" ? "selected" : ""}>
        Closed
    </option>

</select>
             <textarea
                id="update-${caseItem.id}"
                placeholder="Write an update for the citizen..."
                ></textarea>

                <button onclick="sendCaseUpdate('${caseItem.id}')">
                Send Update
                </button>   

            </div>
        `;
    });
}
async function logoutPolice() {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Logout failed: " + error.message);
        return;
    }

    window.location.href = "police-login.html";
}
async function checkPoliceAccess() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "police-login.html";
        return;
    }
}
async function updateCaseStatus(caseId, newStatus) {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Please login first.");
        return;
    }

    // Update the case status
    const { error } = await supabaseClient
        .from("cases")
        .update({
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq("id", caseId);

    if (error) {
        alert("Failed to update status: " + error.message);
        return;
    }

    // Create a timeline update for the citizen
    const statusText = newStatus
        .replace("_", " ")
        .replace(/\b\w/g, function(letter) {
            return letter.toUpperCase();
        });

    const { error: updateError } = await supabaseClient
        .from("case_updates")
        .insert([
            {
                case_id: caseId,
                created_by: user.id,
                message: "Case status changed to " + statusText,
                status: newStatus
            }
        ]);

    if (updateError) {
        alert("Status changed, but timeline update failed: " + updateError.message);
        return;
    }

    alert("Case status and timeline updated successfully!");

    loadPoliceCases();
}
async function sendCaseUpdate(caseId) {

    const updateBox = document.getElementById("update-" + caseId);
    const message = updateBox.value.trim();

    if (message === "") {
        alert("Please write an update first.");
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Please login first.");
        return;
    }

    const { error } = await supabaseClient
        .from("case_updates")
        .insert([
            {
                case_id: caseId,
                created_by: user.id,
                message: message
            }
        ]);

    if (error) {
        alert("Failed to send update: " + error.message);
        return;
    }

    alert("Update sent to the citizen!");

    updateBox.value = "";
}
