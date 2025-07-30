
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    const contentTitle = document.getElementById('content-title');
    const logoutBtn = document.getElementById('logout-btn');
    const adminName = document.getElementById('admin-name');
    const adminAvatar = document.getElementById('admin-avatar');
    
    // Dashboard elements
    const totalUsersEl = document.getElementById('total-users');
    const totalEarningsEl = document.getElementById('total-earnings');
    const totalWithdrawalsEl = document.getElementById('total-withdrawals');
    const activeUsersEl = document.getElementById('active-users');
    const recentWithdrawalsTable = document.getElementById('recent-withdrawals').querySelector('tbody');
    
    // Users section elements
    const usersTable = document.getElementById('users-table').querySelector('tbody');
    const userSearch = document.getElementById('user-search');
    const addUserBtn = document.getElementById('add-user-btn');
    
    // Withdrawals section elements
    const withdrawalsTable = document.getElementById('withdrawals-table').querySelector('tbody');
    const withdrawalSearch = document.getElementById('withdrawal-search');
    
    // Settings section elements
    const settingsForm = document.getElementById('settings-form');
    const dailyTaskLimit = document.getElementById('daily-task-limit');
    const taskReward = document.getElementById('task-reward');
    const referralReward = document.getElementById('referral-reward');
    const dailyReferralLimit = document.getElementById('daily-referral-limit');
    const minWithdrawal = document.getElementById('min-withdrawal');
    
    // Modals
    const addUserModal = document.getElementById('add-user-modal');
    const addUserForm = document.getElementById('add-user-form');
    const closeAddUserModal = document.getElementById('close-add-user-modal');
    const cancelAddUser = document.getElementById('cancel-add-user');
    
    const editUserModal = document.getElementById('edit-user-modal');
    const editUserForm = document.getElementById('edit-user-form');
    const closeEditUserModal = document.getElementById('close-edit-user-modal');
    const cancelEditUser = document.getElementById('cancel-edit-user');
    
    const withdrawalModal = document.getElementById('withdrawal-modal');
    const withdrawalDetails = document.getElementById('withdrawal-details');
    const closeWithdrawalModal = document.getElementById('close-withdrawal-modal');
    const cancelWithdrawal = document.getElementById('cancel-withdrawal');
    const approveWithdrawalBtn = document.getElementById('approve-withdrawal');
    const rejectWithdrawalBtn = document.getElementById('reject-withdrawal');
    
    let currentWithdrawalId = null;

    function initAdminPanel() {
        auth.onAuthStateChanged(user => {
            if (user) {
                adminName.textContent = user.email;
                checkAdminStatus(user.uid);
                loadAllData();
            } else {
                window.location.href = 'login.html'; // Create a login.html page
            }
        });
        setupEventListeners();
    }

    function checkAdminStatus(userId) {
        db.collection('admins').doc(userId).get().then(doc => {
            if (!doc.exists) {
                alert('You are not authorized.');
                window.location.href = 'login.html';
            }
        }).catch(handleError);
    }

    function loadAllData() {
        loadDashboardData();
        loadUsers();
        loadWithdrawals();
        loadSettings();
    }

    function setupEventListeners() {
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                menuItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const section = item.dataset.section;
                contentSections.forEach(sec => sec.style.display = 'none');
                document.getElementById(`${section}-section`).style.display = 'block';
                contentTitle.textContent = item.textContent.trim();
            });
        });

        logoutBtn.addEventListener('click', () => auth.signOut().catch(handleError));
        addUserBtn.addEventListener('click', () => addUserModal.style.display = 'flex');
        closeAddUserModal.addEventListener('click', () => addUserModal.style.display = 'none');
        cancelAddUser.addEventListener('click', () => addUserModal.style.display = 'none');
        addUserForm.addEventListener('submit', handleAddUser);

        closeEditUserModal.addEventListener('click', () => editUserModal.style.display = 'none');
        cancelEditUser.addEventListener('click', () => editUserModal.style.display = 'none');
        editUserForm.addEventListener('submit', handleEditUser);

        closeWithdrawalModal.addEventListener('click', () => withdrawalModal.style.display = 'none');
        cancelWithdrawal.addEventListener('click', () => withdrawalModal.style.display = 'none');
        approveWithdrawalBtn.addEventListener('click', () => handleWithdrawalAction('approved'));
        rejectWithdrawalBtn.addEventListener('click', () => handleWithdrawalAction('rejected'));
        
        settingsForm.addEventListener('submit', handleSaveSettings);

        userSearch.addEventListener('input', (e) => loadUsers(e.target.value));
        withdrawalSearch.addEventListener('input', (e) => loadWithdrawals(e.target.value));
    }

    function handleAddUser(e) {
        e.preventDefault();
        const email = document.getElementById('user-email').value;
        const password = document.getElementById('user-password').value;
        const balance = parseFloat(document.getElementById('user-balance').value);

        // In a real app, you should use a Firebase Function to create users to keep admin credentials secure.
        // This is a client-side example and has security risks.
        auth.createUserWithEmailAndPassword(email, password)
            .then(userCredential => {
                return db.collection('users').doc(userCredential.user.uid).set({
                    email,
                    balance,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                    isBanned: false
                });
            })
            .then(() => {
                alert('User created successfully');
                addUserForm.reset();
                addUserModal.style.display = 'none';
                loadUsers();
            })
            .catch(handleError);
    }

    function handleEditUser(e) {
        e.preventDefault();
        const userId = document.getElementById('edit-user-id').value;
        const email = document.getElementById('edit-user-email').value;
        const balance = parseFloat(document.getElementById('edit-user-balance').value);
        const isBanned = document.getElementById('edit-user-status').value === 'banned';

        db.collection('users').doc(userId).update({ email, balance, isBanned })
            .then(() => {
                alert('User updated successfully');
                editUserModal.style.display = 'none';
                loadUsers();
            })
            .catch(handleError);
    }
    
    function handleSaveSettings(e) {
        e.preventDefault();
        const settings = {
            dailyTaskLimit: parseInt(dailyTaskLimit.value),
            rewardPerTaskUSD: parseFloat(taskReward.value),
            referralRewardUSD: parseFloat(referralReward.value),
            dailyReferralLimit: parseInt(dailyReferralLimit.value),
            minWithdrawalUSD: parseFloat(minWithdrawal.value),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        db.collection('settings').doc('appSettings').set(settings, { merge: true })
            .then(() => alert('Settings saved successfully'))
            .catch(handleError);
    }

    function loadDashboardData() {
        db.collection('users').onSnapshot(snapshot => {
            totalUsersEl.textContent = snapshot.size;
            let totalEarnings = 0;
            let activeCount = 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            snapshot.forEach(doc => {
                const user = doc.data();
                totalEarnings += user.balance || 0;
                if (user.lastActive && user.lastActive.toDate() >= today) {
                    activeCount++;
                }
            });
            totalEarningsEl.textContent = `${totalEarnings.toFixed(2)} USDT`;
            activeUsersEl.textContent = activeCount;
        }, handleError);

        db.collection('withdrawals').where('status', '==', 'approved').onSnapshot(snapshot => {
            let total = 0;
            snapshot.forEach(doc => { total += doc.data().amount || 0; });
            totalWithdrawalsEl.textContent = `${total.toFixed(2)} USDT`;
        }, handleError);

        db.collection('withdrawals').orderBy('createdAt', 'desc').limit(5).onSnapshot(snapshot => {
            recentWithdrawalsTable.innerHTML = '';
            if (snapshot.empty) {
                recentWithdrawalsTable.innerHTML = '<tr><td colspan="6">No recent withdrawals</td></tr>';
            } else {
                snapshot.forEach(doc => renderWithdrawalRow(doc, recentWithdrawalsTable));
            }
        }, handleError);
    }

    function loadUsers(searchTerm = '') {
        let query = db.collection('users').orderBy('email');
        if (searchTerm) {
            query = query.startAt(searchTerm).endAt(searchTerm + '\uf8ff');
        }
        query.get().then(snapshot => {
            usersTable.innerHTML = '';
            if (snapshot.empty) {
                usersTable.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
                return;
            }
            snapshot.forEach(doc => {
                const user = doc.data();
                const row = usersTable.insertRow();
                row.innerHTML = `
                    <td>${doc.id.substring(0, 8)}...</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${(user.balance || 0).toFixed(2)} USDT</td>
                    <td>${user.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
                    <td><span class="status ${user.isBanned ? 'rejected' : 'approved'}">${user.isBanned ? 'Banned' : 'Active'}</span></td>
                    <td>
                        <button class="action-btn edit-btn" data-id="${doc.id}"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-btn delete-btn" data-id="${doc.id}"><i class="fas fa-trash"></i> Delete</button>
                    </td>
                `;
                row.querySelector('.edit-btn').addEventListener('click', () => openEditUserModal(doc.id));
                row.querySelector('.delete-btn').addEventListener('click', () => deleteUser(doc.id, user.email));
            });
        }).catch(handleError);
    }

    function loadWithdrawals(searchTerm = '') {
        let query = db.collection('withdrawals').orderBy('createdAt', 'desc');
        if (searchTerm) {
            query = query.where('userEmail', '>=', searchTerm).where('userEmail', '<=', searchTerm + '\uf8ff');
        }
        query.onSnapshot(snapshot => {
            withdrawalsTable.innerHTML = '';
            if (snapshot.empty) {
                withdrawalsTable.innerHTML = '<tr><td colspan="6">No withdrawals found</td></tr>';
            } else {
                snapshot.forEach(doc => renderWithdrawalRow(doc, withdrawalsTable, true));
            }
        }, handleError);
    }
    
    function loadSettings() {
        db.collection('settings').doc('appSettings').get().then(doc => {
            if (doc.exists) {
                const settings = doc.data();
                dailyTaskLimit.value = settings.dailyTaskLimit || '';
                taskReward.value = settings.rewardPerTaskUSD || '';
                referralReward.value = settings.referralRewardUSD || '';
                dailyReferralLimit.value = settings.dailyReferralLimit || '';
                minWithdrawal.value = settings.minWithdrawalUSD || '';
            }
        }).catch(handleError);
    }

    function renderWithdrawalRow(doc, table, includeActions = false) {
        const withdrawal = doc.data();
        const row = table.insertRow();
        let actionsHtml = `<button class="action-btn edit-btn view-withdrawal" data-id="${doc.id}"><i class="fas fa-eye"></i> View</button>`;
        if (includeActions && withdrawal.status === 'pending') {
            actionsHtml += `
                <button class="action-btn approve-btn" data-id="${doc.id}"><i class="fas fa-check"></i> Approve</button>
                <button class="action-btn reject-btn" data-id="${doc.id}"><i class="fas fa-times"></i> Reject</button>`;
        }
        row.innerHTML = `
            <td>${withdrawal.userEmail || 'N/A'}</td>
            <td>${withdrawal.amount.toFixed(2)} USDT</td>
            <td>${withdrawal.method || 'N/A'}</td>
            <td>${withdrawal.createdAt?.toDate().toLocaleDateString() || 'N/A'}</td>
            <td><span class="status ${withdrawal.status || 'pending'}">${withdrawal.status || 'Pending'}</span></td>
            <td>${actionsHtml}</td>
        `;
        row.querySelector('.view-withdrawal').addEventListener('click', () => openWithdrawalModal(doc.id));
        if (includeActions && withdrawal.status === 'pending') {
            row.querySelector('.approve-btn').addEventListener('click', () => handleWithdrawalAction('approved', doc.id));
            row.querySelector('.reject-btn').addEventListener('click', () => handleWithdrawalAction('rejected', doc.id));
        }
    }
    
    function openEditUserModal(userId) {
        db.collection('users').doc(userId).get().then(doc => {
            if (doc.exists) {
                const user = doc.data();
                document.getElementById('edit-user-id').value = doc.id;
                document.getElementById('edit-user-email').value = user.email || '';
                document.getElementById('edit-user-balance').value = user.balance || 0;
                document.getElementById('edit-user-status').value = user.isBanned ? 'banned' : 'active';
                editUserModal.style.display = 'flex';
            }
        }).catch(handleError);
    }
    
    function deleteUser(userId, email) {
        if (confirm(`Are you sure you want to delete user ${email}? This action cannot be undone.`)) {
            // Deleting the auth user from the client is a security risk.
            // This should be done via a Firebase Function.
            // For this example, we only delete from Firestore.
            db.collection('users').doc(userId).delete()
                .then(() => {
                    alert('User deleted from Firestore successfully.');
                    loadUsers();
                })
                .catch(handleError);
        }
    }

    function openWithdrawalModal(id) {
        currentWithdrawalId = id;
        db.collection('withdrawals').doc(id).get().then(doc => {
            if (doc.exists) {
                const w = doc.data();
                withdrawalDetails.innerHTML = `
                    <p><strong>User:</strong> ${w.userEmail || 'N/A'}</p>
                    <p><strong>Amount:</strong> ${w.amount.toFixed(2)} USDT</p>
                    <p><strong>Method:</strong> ${w.method || 'N/A'}</p>
                    <p><strong>Address:</strong> ${w.address || 'N/A'}</p>
                    <p><strong>Date:</strong> ${w.createdAt?.toDate().toLocaleString() || 'N/A'}</p>
                    <p><strong>Status:</strong> <span class="status ${w.status || 'pending'}">${w.status || 'Pending'}</span></p>
                `;
                approveWithdrawalBtn.style.display = w.status === 'pending' ? 'inline-block' : 'none';
                rejectWithdrawalBtn.style.display = w.status === 'pending' ? 'inline-block' : 'none';
                withdrawalModal.style.display = 'flex';
            }
        }).catch(handleError);
    }
    
    function handleWithdrawalAction(status, id) {
        const wId = id || currentWithdrawalId;
        if (!wId) return;

        db.collection('withdrawals').doc(wId).update({
            status: status,
            processedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert(`Withdrawal has been ${status}.`);
            withdrawalModal.style.display = 'none';
        }).catch(handleError);
    }

    function handleError(error) {
        console.error("An error occurred:", error);
        alert("Error: " + error.message);
    }

    initAdminPanel();
});
