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
        casesList.innerHTML =
            "<p>Failed to load cases: " + error.message + "</p>";
        return;
    }

    if (data.length === 0) {
        casesList.innerHTML =
            "<p>You have not submitted any cases yet.</p>";
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
                    <strong>Location:</strong>
                    ${caseItem.location}
                </p>

                <p>
                    <strong>Incident Date:</strong>
                    ${caseItem.incident_date}
                </p>

                <div class="case-flow">

                    <div class="flow-step ${caseItem.status === "submitted" ? "active" : ""}">
                        <span>1</span>
                        <small>Submitted</small>
                    </div>

                    <div class="flow-line"></div>

                    <div class="flow-step ${caseItem.status === "under_review" ? "active" : ""}">
                        <span>2</span>
                        <small>Under Review</small>
                    </div>

                    <div class="flow-line"></div>

                    <div class="flow-step ${caseItem.status === "assigned" ? "active" : ""}">
                        <span>3</span>
                        <small>Assigned</small>
                    </div>

                    <div class="flow-line"></div>

                    <div class="flow-step ${caseItem.status === "investigation" ? "active" : ""}">
                        <span>4</span>
                        <small>Investigation</small>
                    </div>

                    <div class="flow-line"></div>

                    <div class="flow-step ${caseItem.status === "resolved" ? "active" : ""}">
                        <span>5</span>
                        <small>Resolved</small>
                    </div>

                    <div class="flow-line"></div>

                    <div class="flow-step ${caseItem.status === "closed" ? "active" : ""}">
                        <span>6</span>
                        <small>Closed</small>
                    </div>

                </div>

                <p>${caseItem.description}</p>

                <!-- Separate chat area for THIS case -->
                <div id="updates-${caseItem.id}">
                    <p>Loading messages...</p>
                </div>

            </div>
        `;

        loadCaseUpdates(caseItem.id);
    });
}
async function loadCaseUpdates(caseId) {
    const updatesBox = document.getElementById("updates-" + caseId);

    if (!updatesBox) {
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        updatesBox.innerHTML = "<p>Please login first.</p>";
        return;
    }

    const { data, error } = await supabaseClient
        .from("case_updates")
        .select("id, case_id, created_by, message, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Case chat error:", error);

        updatesBox.innerHTML = `
            <div class="chat-box">
                <h4>Case Chat</h4>
                <p style="color:red;">
                    Chat error: ${error.message}
                </p>
            </div>
        `;

        return;
    }

    let messagesHTML = `
        <div class="chat-box">
            <h4>💬 Case Chat</h4>

            <div class="messages-list">
    `;

    if (!data || data.length === 0) {

        messagesHTML += `
            <p class="no-messages">
                No messages yet.
            </p>
        `;

    } else {

        data.forEach(function(update) {

            const isMe = update.created_by === user.id;

            messagesHTML += `
                <div class="message ${isMe ? "citizen-message" : "police-message"}">

                    <div class="message-name">
                        ${isMe ? "👤 You" : "👮 Police"}
                    </div>

                    <div class="message-text">
                        ${update.message}
                    </div>

                    <div class="message-time">
                        ${new Date(update.created_at).toLocaleString()}
                    </div>

                </div>
            `;
        });
    }

    messagesHTML += `
            </div>

            <div class="chat-input">

                <textarea
                    id="chat-${caseId}"
                    placeholder="Type your message to the police..."
                ></textarea>

                <button onclick="sendCitizenMessage('${caseId}')">
                    Send
                </button>

            </div>

        </div>
    `;

    updatesBox.innerHTML = messagesHTML;
}
async function sendCitizenMessage(caseId) {

    const messageBox = document.getElementById("chat-" + caseId);
    const message = messageBox.value.trim();

    if (message === "") {
        alert("Please type a message.");
        return;
    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        alert("Please login first.");
        return;
    }

    const { error } = await supabaseClient
        .from("case_updates")
        .insert([{
            case_id: caseId,
            created_by: user.id,
            message: message
        }]);

    if (error) {
        alert("Failed to send message: " + error.message);
        return;
    }

    messageBox.value = "";

    loadCaseUpdates(caseId);
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

    const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

    if (profileError || !profile || profile.role !== "police") {
        alert("This account is not authorized for police login.");
        await supabaseClient.auth.signOut();
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

    const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error || !profile || profile.role !== "police") {
        alert("Access denied. Police personnel only.");
        await supabaseClient.auth.signOut();
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
        .insert([{
            case_id: caseId,
            created_by: user.id,
            message: message
        }]);

    if (error) {
        alert("Failed to send update: " + error.message);
        return;
    }

    updateBox.value = "";

    alert("Message sent to citizen!");

    loadPoliceCases();
}
setInterval(function () {

    const chatBoxes = document.querySelectorAll('[id^="updates-"]');

    chatBoxes.forEach(function(box) {

        const caseId = box.id.replace("updates-", "");

        loadCaseUpdates(caseId);

    });

}, 3000);
