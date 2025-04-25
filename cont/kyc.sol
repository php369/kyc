// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DigitalKYC (Unrestricted Access Version)
 * @notice Manages a Know Your Customer (KYC) process on the blockchain.
 * @dev Allows registration of Customers, Bank Employees, and Admins.
 * Customers submit KYC applications with documents stored on IPFS.
 * Bank Employees verify applications based on their branch IFSC code.
 * Admins provide final approval and manage users.
 * Approved KYC records expire after a defined duration.
 * !!!!! WARNING: All access control modifiers and checks have been removed. Anyone can call any function. !!!!!
 */
contract DigitalKYC_Unrestricted {
    address public admin; // Retained for potential initial admin reference
    uint256 public kycExpiryDuration = 730 days; // Default 2 years

    // --- Enums ---

    /**
     * @dev Represents the possible states of a KYC application.
     */
    enum KYCStatus { Pending, VerifiedByEmployee, ApprovedByAdmin, Rejected, Expired }

    // --- Structs ---

    /**
     * @dev Represents a KYC application record.
     */
    struct KYCApplication {
        address applicant;
        string ipfsHash;
        string ifscCode;
        KYCStatus status;
        uint256 submissionDate;
        uint256 expiryDate;
        string rejectionReason;
        address lastUpdatedBy; // Track who verified/approved/rejected
    }

    /**
     * @dev Represents a registered user in the system.
     */
    struct User {
        uint8 role; // 1: Customer, 2: BankEmployee, 3: Admin
        string ifscCode;
        bool isActive;
    }

    // --- Mappings ---

    mapping(address => User) public users; // User address -> User details
    mapping(address => KYCApplication) public kycRecords; // Customer address -> KYC application
    mapping(string => address[]) internal ifscEmployees; // IFSC code -> List of active employee addresses
    mapping(string => mapping(address => uint256)) internal ifscEmployeeIndex; // Helper: IFSC -> Employee Address -> Index in ifscEmployees array

    // --- Events ---

    event UserAdded(address indexed user, uint8 role, string ifscCode);
    event UserDeactivated(address indexed user);
    event UserActivated(address indexed user);
    event EmployeeIFSCUpdated(address indexed employee, string oldIFSC, string newIFSC);

    event KYCSubmitted(address indexed applicant, string ipfsHash, string ifscCode);
    event KYCVerifiedByEmployee(address indexed applicant, address indexed verifiedBy);
    event KYCApprovedByAdmin(address indexed applicant, address indexed approvedBy, uint256 expiryDate);
    event KYCRejected(address indexed applicant, address indexed rejectedBy, string reason);
    event KYCExpired(address indexed applicant);
    event IPFSUpdated(address indexed user, string oldHash, string newHash);

    // --- Modifiers ---
    // !!!!! All modifiers removed for unrestricted access !!!!!

    // --- Constructor ---

    /**
     * @notice Sets the contract deployer as the first admin.
     */
    constructor() {
        admin = msg.sender; // Keep track of the deployer if needed
        users[msg.sender] = User({ role: 3, ifscCode: "", isActive: true });
        emit UserAdded(msg.sender, 3, "");
    }

    //------------------ Internal Helper Functions ------------------

    /**
     * @dev Updates the KYC status to Expired if the current time is past the expiry date.
     * @param _applicant The address of the customer whose KYC record to check.
     */
    function _updateExpiryStatus(address _applicant) internal {
        KYCApplication storage app = kycRecords[_applicant];
        // Only transition from ApprovedByAdmin to Expired
        if (app.status == KYCStatus.ApprovedByAdmin && app.expiryDate > 0 && block.timestamp >= app.expiryDate) {
            app.status = KYCStatus.Expired;
            emit KYCExpired(_applicant);
        }
    }

    /**
     * @dev Removes an employee address from a specific IFSC list.
     */
    function _removeEmployeeFromIFSCList(string memory _ifsc, address _employee) internal {
        uint256 index = ifscEmployeeIndex[_ifsc][_employee];
        address[] storage employees = ifscEmployees[_ifsc];

        // Check bounds before accessing index, required even without access control
        if (index >= employees.length || employees[index] != _employee) {
             // Cannot remove if index is wrong or element mismatch
             // Consider reverting or simply returning, depending on desired behavior
             // Reverting might be safer to signal failure.
             // require(false, "IFSC: Employee not found at index for removal"); // Option: Revert
             return; // Option: Silently do nothing
        }


        // Swap the element to remove with the last element
        address lastEmployee = employees[employees.length - 1];
        employees[index] = lastEmployee;
        ifscEmployeeIndex[_ifsc][lastEmployee] = index; // Update the index of the moved element

        // Remove the last element
        delete ifscEmployeeIndex[_ifsc][_employee]; // Clear the index of the removed employee
        employees.pop();
    }

    /**
     * @dev Adds an employee address to a specific IFSC list and updates the index mapping.
     */
    function _addEmployeeToIFSCList(string memory _ifsc, address _employee) internal {
        // Prevent adding duplicates implicitly by checking index, though not strictly required by prompt
        // if (ifscEmployeeIndex[_ifsc][_employee] == 0 && ifscEmployees[_ifsc].length > 0 && ifscEmployees[_ifsc][0] == _employee) {
        //    // Already exists at index 0
        // } else if (ifscEmployeeIndex[_ifsc][_employee] > 0) {
        //     // Already exists at non-zero index
        // } else {
             ifscEmployees[_ifsc].push(_employee);
             ifscEmployeeIndex[_ifsc][_employee] = ifscEmployees[_ifsc].length - 1; // Store index
        // }
    }


    //------------------ User Registration & Management (Unrestricted) ------------------

    /**
     * @notice Adds a new customer user. Anyone can call this.
     * @param _user Address of the new customer.
     */
    function addCustomer(address _user) external /* removed onlyAdmin */ {
        require(_user != address(0), "USER: Invalid zero address");
        require(users[_user].role == 0, "USER: User already registered"); // Prevent re-registration

        users[_user] = User({ role: 1, ifscCode: "", isActive: true });
        emit UserAdded(_user, 1, "");
    }

    /**
     * @notice Adds a new bank employee user. Anyone can call this.
     * @param _user Address of the new employee.
     * @param _ifsc IFSC code of the branch the employee belongs to.
     */
    function addBankEmployee(address _user, string calldata _ifsc) external /* removed onlyAdmin */ {
        require(_user != address(0), "USER: Invalid zero address");
        require(bytes(_ifsc).length > 0, "IFSC: IFSC required for employee");
        require(users[_user].role == 0, "USER: User already registered");

        users[_user] = User({ role: 2, ifscCode: _ifsc, isActive: true });
        _addEmployeeToIFSCList(_ifsc, _user);
        emit UserAdded(_user, 2, _ifsc);
    }

    /**
     * @notice Adds a new admin user. Anyone can call this.
     * @param _user Address of the new admin.
     */
    function addAdmin(address _user) external /* removed onlyAdmin */ {
        require(_user != address(0), "USER: Invalid zero address");
        require(users[_user].role == 0, "USER: User already registered");

        users[_user] = User({ role: 3, ifscCode: "", isActive: true });
        emit UserAdded(_user, 3, "");
    }

    /**
     * @notice Deactivates a user (customer, employee, or admin). Anyone can call this.
     * @param _user Address of the user to deactivate.
     */
    function deactivateUser(address _user) external /* removed onlyAdmin, userExists(_user) */ {
        // require(users[_user].role != 0, "USER: User does not exist"); // Removed userExists check
        User storage userToDeactivate = users[_user];
        require(userToDeactivate.role != 0, "USER: User does not exist"); // Keep check that user actually exists before deactivating
        require(userToDeactivate.isActive, "USER: User already inactive");
        // require(_user != msg.sender, "ADMIN: Admin cannot deactivate self"); // Removed self-deactivation check

        userToDeactivate.isActive = false;

        // If employee, remove from IFSC tracking
        if (userToDeactivate.role == 2 && bytes(userToDeactivate.ifscCode).length > 0) {
            _removeEmployeeFromIFSCList(userToDeactivate.ifscCode, _user);
        }

        emit UserDeactivated(_user);
    }

    /**
     * @notice Activates a previously deactivated user. Anyone can call this.
     * @param _user Address of the user to activate.
     */
    function activateUser(address _user) external /* removed onlyAdmin, userExists(_user) */ {
        // require(users[_user].role != 0, "USER: User does not exist"); // Removed userExists check
        User storage userToActivate = users[_user];
        require(userToActivate.role != 0, "USER: User does not exist"); // Keep check that user actually exists before activating
        require(!userToActivate.isActive, "USER: User already active");

        userToActivate.isActive = true;

        // If employee, add back to IFSC tracking
        if (userToActivate.role == 2 && bytes(userToActivate.ifscCode).length > 0) {
            _addEmployeeToIFSCList(userToActivate.ifscCode, _user);
        }

        emit UserActivated(_user);
    }

     /**
     * @notice Updates the IFSC code for an existing bank employee. Anyone can call this.
     * @param _employee Address of the employee whose IFSC code needs updating.
     * @param _newIfsc The new IFSC code.
     */
    function updateEmployeeIFSC(address _employee, string calldata _newIfsc)
        external
        /* removed onlyAdmin, userExists(_employee) */
    {
        User storage employee = users[_employee];
        require(employee.role != 0, "USER: User does not exist"); // Keep check user exists
        require(employee.role == 2, "USER: User is not an employee");
        require(bytes(_newIfsc).length > 0, "IFSC: New IFSC required");
        require(keccak256(bytes(employee.ifscCode)) != keccak256(bytes(_newIfsc)), "IFSC: New IFSC is same as old");

        string memory oldIfsc = employee.ifscCode;

        // Remove from old IFSC list if it exists and employee is active
        if (bytes(oldIfsc).length > 0 && employee.isActive) {
            _removeEmployeeFromIFSCList(oldIfsc, _employee);
        }

        // Update IFSC in user struct
        employee.ifscCode = _newIfsc;

        // Add to new IFSC list if employee is active
        if (employee.isActive) {
            _addEmployeeToIFSCList(_newIfsc, _employee);
        }

        emit EmployeeIFSCUpdated(_employee, oldIfsc, _newIfsc);
    }

    //------------------ Core KYC Workflow Functions (Unrestricted) ------------------

    /**
     * @notice Any user submits a new KYC application or resubmits after rejection/expiry for THEMSELF.
     * @param _ipfsHash IPFS hash of the KYC documents.
     * @param _ifscCode IFSC code of the bank branch for verification.
     */
    function submitKYC(string calldata _ipfsHash, string calldata _ifscCode) external /* removed onlyCustomer */ {
        // require(users[msg.sender].role == 1 && users[msg.sender].isActive, "AUTH: Caller not an active Customer"); // Removed role check
        require(bytes(_ipfsHash).length > 0, "KYC: IPFS hash required");
        require(bytes(_ifscCode).length > 0, "KYC: IFSC code required");

        address applicant = msg.sender; // Action is performed by the caller for themself
        _updateExpiryStatus(applicant); // Ensure status is current before checking

        KYCApplication storage existingApp = kycRecords[applicant];

        // Allow submission only if no application exists OR if the existing one is Rejected or Expired.
        require(
            existingApp.applicant == address(0) || // No previous record
            existingApp.status == KYCStatus.Rejected ||
            existingApp.status == KYCStatus.Expired,
            "KYC: Active or pending application exists for caller"
        );

        // Overwrite or create new application for the caller
        kycRecords[applicant] = KYCApplication({
            applicant: applicant,
            ipfsHash: _ipfsHash,
            ifscCode: _ifscCode,
            status: KYCStatus.Pending,
            submissionDate: block.timestamp,
            expiryDate: 0,
            rejectionReason: "", // Clear previous rejection reason if any
            lastUpdatedBy: address(0)
        });

        emit KYCSubmitted(applicant, _ipfsHash, _ifscCode);
    }

    /**
     * @notice Anyone verifies (approves first level) a KYC application for a given applicant.
     * @param _applicant The address of the customer whose KYC to verify.
     */
    function verifyKYC(address _applicant) external /* removed onlyEmployee, userExists(_applicant), userActive(_applicant) */ {
        // require(users[_applicant].role != 0, "USER: User does not exist"); // Removed userExists check
        // require(users[_applicant].isActive, "USER: User is not active"); // Removed userActive check
        // require(users[msg.sender].role == 2 && users[msg.sender].isActive, "AUTH: Caller not an active Bank Employee"); // Removed caller role check
        require(users[_applicant].role == 1, "KYC: Applicant must be a customer"); // Keep check that target is a customer

        KYCApplication storage app = kycRecords[_applicant];
        require(app.applicant == _applicant, "KYC: Record not found for applicant"); // Ensure record exists
        require(app.status == KYCStatus.Pending, "KYC: Status not Pending");

        // User storage employee = users[msg.sender]; // Removed: Caller doesn't need to be employee
        // require( // Removed IFSC check
        //     keccak256(bytes(app.ifscCode)) == keccak256(bytes(employee.ifscCode)),
        //     "IFSC: Employee IFSC does not match application IFSC"
        // );

        app.status = KYCStatus.VerifiedByEmployee;
        app.lastUpdatedBy = msg.sender; // Record who called verify
        app.rejectionReason = ""; // Clear any prior rejection reasons if somehow set

        emit KYCVerifiedByEmployee(_applicant, msg.sender);
    }

    /**
     * @notice Anyone provides the final approval for a KYC application for a given applicant.
     * @param _applicant The address of the customer whose KYC to approve.
     */
    function adminApproveKYC(address _applicant) external /* removed onlyAdmin, userExists(_applicant), userActive(_applicant) */ {
        // require(users[_applicant].role != 0, "USER: User does not exist"); // Removed userExists check
        // require(users[_applicant].isActive, "USER: User is not active"); // Removed userActive check
        // require(users[msg.sender].role == 3 && users[msg.sender].isActive, "AUTH: Caller not an active Admin"); // Removed caller role check
        require(users[_applicant].role == 1, "KYC: Applicant must be a customer"); // Keep check that target is a customer

        KYCApplication storage app = kycRecords[_applicant];
        require(app.applicant == _applicant, "KYC: Record not found for applicant");
        require(app.status == KYCStatus.VerifiedByEmployee, "KYC: Status not VerifiedByEmployee");

        app.status = KYCStatus.ApprovedByAdmin;
        app.expiryDate = block.timestamp + kycExpiryDuration;
        app.lastUpdatedBy = msg.sender; // Record who called approve
        app.rejectionReason = "";

        emit KYCApprovedByAdmin(_applicant, msg.sender, app.expiryDate);
    }

    /**
     * @notice Anyone can reject a KYC application for a given applicant.
     * @param _applicant The address of the customer whose KYC to reject.
     * @param _reason The reason for rejection.
     */
    function rejectKYC(address _applicant, string calldata _reason) external /* removed userExists(_applicant) */ {
        // require(users[msg.sender].isActive, "AUTH: Caller is not active"); // Removed caller active check
        // require(users[_applicant].role != 0, "USER: User does not exist"); // Removed userExists check

        KYCApplication storage app = kycRecords[_applicant];
        require(app.applicant == _applicant, "KYC: Record not found for applicant");
        require(bytes(_reason).length > 0, "KYC: Rejection reason required");
        require(
            app.status == KYCStatus.Pending || app.status == KYCStatus.VerifiedByEmployee,
            "KYC: Status cannot be rejected"
        ); // Can reject pending or employee-verified

        // User storage caller = users[msg.sender]; // Removed caller info fetch

        // --- Authorization Check Removed ---
        // bool isAuthorized = false;
        // if (caller.role == 3) { // Admin
        //     isAuthorized = true;
        // } else if (caller.role == 2) { // Employee
        //     if (keccak256(bytes(app.ifscCode)) == keccak256(bytes(caller.ifscCode))) {
        //         isAuthorized = true;
        //     }
        // }
        // require(isAuthorized, "AUTH: Unauthorized to reject this KYC");
        // --- End Authorization Check Removed ---

        app.status = KYCStatus.Rejected;
        app.rejectionReason = _reason;
        app.lastUpdatedBy = msg.sender; // Record who called reject
        app.expiryDate = 0; // No expiry for rejected KYC

        emit KYCRejected(_applicant, msg.sender, _reason);
    }

    //------------------ Document Management (Unrestricted) ------------------

    /**
     * @notice Allows any user to update their IPFS document hash *only* if their KYC is Pending.
     * @param _newHash The new IPFS hash for the documents.
     */
    function updateIPFSHash(string calldata _newHash) external /* removed onlyCustomer */ {
        // require(users[msg.sender].role == 1 && users[msg.sender].isActive, "AUTH: Caller not an active Customer"); // Removed caller role check
        require(bytes(_newHash).length > 0, "IPFS: New IPFS hash required");

        KYCApplication storage app = kycRecords[msg.sender]; // Action is performed by the caller for themself
        require(app.applicant == msg.sender, "KYC: No KYC record found for caller"); // Check if KYC submitted by caller

        // Allow update only if status is Pending
        require(app.status == KYCStatus.Pending, "KYC: Can only update IPFS hash when status is Pending");

        string memory oldHash = app.ipfsHash;
        app.ipfsHash = _newHash;

        emit IPFSUpdated(msg.sender, oldHash, _newHash);
    }

    //------------------ Public Utility / Check (Unrestricted) ------------------

    /**
     * @notice Allows anyone to trigger an update to check if an approved KYC has expired.
     * @param _applicant The address of the customer whose KYC to check.
     */
    function checkExpiry(address _applicant) external {
        // No access control needed here, anyone can trigger the check.
        _updateExpiryStatus(_applicant);
    }

    //------------------ View Functions (Unrestricted access inherent) ------------------

    /**
     * @notice Returns the role of a given user address. Returns 0 if inactive or not registered.
     * @param _userAddress The address to query.
     * @return role The user's role (1: Customer, 2: Employee, 3: Admin, 0: Inactive/None).
     */
    function getUserRole(address _userAddress) external view returns (uint8 role) {
        User memory user = users[_userAddress];
        if (!user.isActive) {
            return 0; // Treat inactive users as having no role for permission checks
        }
        return user.role;
    }

    /**
    * @notice Returns key details of a KYC application, reporting expiry status based on current time. Does not modify state.
    * @param _applicant The address of the customer to query.
    * @return status The current KYCStatus (reports Expired if applicable).
    * @return ipfsHash The IPFS hash associated with the application.
    * @return expiryDate The calculated expiry timestamp (0 if not approved).
    * @return rejectionReason The rejection reason, if applicable.
    * @return lastUpdatedBy The address that last changed the status.
    */
    function getKYCDetails(address _applicant)
        external
        view
        returns (
            KYCStatus status,
            string memory ipfsHash,
            uint256 expiryDate,
            string memory rejectionReason,
            address lastUpdatedBy
        )
    {
        KYCApplication memory app = kycRecords[_applicant];
        status = app.status;
        // Check expiry based on current time *without* modifying state for this view function
        if (app.status == KYCStatus.ApprovedByAdmin && app.expiryDate > 0 && block.timestamp >= app.expiryDate) {
            status = KYCStatus.Expired; // Report as expired if conditions met
        }
        // Return stored values
        return (status, app.ipfsHash, app.expiryDate, app.rejectionReason, app.lastUpdatedBy);
    }


    /**
     * @notice Returns the list of *active* bank employee addresses for a given IFSC code.
     * @param _ifsc The IFSC code to query.
     * @return A list of active employee addresses.
     */
    function getActiveIFSCEmployees(string calldata _ifsc) external view returns (address[] memory) {
        address[] storage employees = ifscEmployees[_ifsc];
        uint activeCount = 0;
        for (uint i = 0; i < employees.length; i++) {
            if (users[employees[i]].isActive) {
                activeCount++;
            }
        }

        address[] memory activeEmployees = new address[](activeCount);
        uint currentIndex = 0;
        for (uint i = 0; i < employees.length; i++) {
             if (users[employees[i]].isActive) {
                 activeEmployees[currentIndex] = employees[i];
                 currentIndex++;
             }
        }
        return activeEmployees;
    }

     /**
     * @notice Returns the details for a specific user.
     * @param _userAddress The address of the user.
     * @return role The user's role (0 if inactive/non-existent).
     * @return ifscCode The user's IFSC code (if applicable).
     * @return isActive The user's active status.
     */
    function getUserDetails(address _userAddress) external view returns (uint8 role, string memory ifscCode, bool isActive) {
        User memory user = users[_userAddress];
        return (user.role, user.ifscCode, user.isActive);
    }
}