const fs = require('fs');
const path = require('path');

const controllerPath = path.join(
    __dirname,
    'quickbooks.controller.ts',
);

const outputPath = path.join(
    __dirname,
    'QuickBooks-NestJS-API.postman_collection.json',
);

const controller = fs.readFileSync(controllerPath, 'utf8');

// Extract all @Post routes from the controller
const routeRegex = /@Post\(['"`]([^'"`]+)['"`]\)/g;

const routes = [];
let match;

while ((match = routeRegex.exec(controller)) !== null) {
    routes.push(match[1]);
}

const uniqueRoutes = [...new Set(routes)];

// Separate into OAuth, Credentials, and Business APIs
const oauthRoutes = uniqueRoutes.filter((r) =>
    r.startsWith('oauth/'),
);

const credentialRoutes = uniqueRoutes.filter((r) =>
    r.startsWith('credentials/'),
);

const rawBusinessRoutes = uniqueRoutes.filter(
    (r) =>
        !r.startsWith('oauth/') &&
        !r.startsWith('credentials/'),
);

const customBodies = {
    // OAuth
    'oauth/authorize': {
        realmId: '{{realmId}}',
    },

    'oauth/callback': {
        code: 'test_authorization_code',
        state: 'quickbooks',
        realmId: '{{realmId}}',
    },

    'oauth/refreshToken': {
        realmId: '{{realmId}}',
    },

    // Credentials
    'credentials/create': {
        realmId: 'test_realm_id',
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiresAt: '2026-12-31T23:59:59.000Z',
    },

    'credentials/get': {
        realmId: '{{realmId}}',
    },

    'credentials/update': {
        realmId: 'test_realm_id',
        accessToken: 'updated_access_token',
        refreshToken: 'updated_refresh_token',
    },

    'credentials/delete': {
        realmId: 'test_realm_id',
    },

    // Account
    'account/create': {
        realmId: '{{realmId}}',
        name: 'Postman Test Account {{timestamp}}',
        accountType: 'Expense',
        accountSubType: 'OtherBusinessExpenses',
    },

    'account/update': {
        realmId: '{{realmId}}',
        id: '{{accountId}}',
        syncToken: '{{accountSyncToken}}',
        name: 'Postman Test Account Updated {{timestamp}}',
        accountType: 'Expense',
        accountSubType: 'OtherBusinessExpenses',
    },

    'account/get': {
        realmId: '{{realmId}}',
        id: '{{accountId}}',
    },

    'account/query': {
        realmId: '{{realmId}}',
        query: 'SELECT * FROM Account MAXRESULTS 10',
    },

    // AccountListDetail
    'accountListDetail/get': {
        realmId: '{{realmId}}',
        account_type: 'Expense',
        columns: 'account_name,account_type',
    },

    'accountListDetail/getMany': {
        realmId: '{{realmId}}',
        account_type: 'Expense',
        columns: 'account_name,account_type',
    },

    // Attachable
    'attachable/create': {
        realmId: '{{realmId}}',
        FileName: 'receipt.pdf',
        ContentType: 'application/pdf',
    },

    'attachable/update': {
        realmId: '{{realmId}}',
        id: '{{attachableId}}',
        syncToken: '{{attachableSyncToken}}',
        FileName: 'receipt_updated.pdf',
    },

    'batch/create': {
        realmId: '{{realmId}}',
        BatchItemRequest: [
            {
                bId: '1',
                operation: 'query',
                Query: 'SELECT * FROM Customer MAXRESULTS 1',
            },
        ],
    },

    // Bill
    'bill/create': {
        realmId: '{{realmId}}',
        VendorRef: {
            value: '{{vendorId}}',
        },
        Line: [
            {
                Amount: 50.0,
                DetailType: 'AccountBasedExpenseLineDetail',
                AccountBasedExpenseLineDetail: {
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
        ],
    },

    'bill/update': {
        realmId: '{{realmId}}',
        id: '{{billId}}',
        syncToken: '{{billSyncToken}}',
        VendorRef: {
            value: '{{vendorId}}',
        },
        Line: [
            {
                Amount: 60.0,
                DetailType: 'AccountBasedExpenseLineDetail',
                AccountBasedExpenseLineDetail: {
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
        ],
    },

    // BillPayment
    'billPayment/create': {
        realmId: '{{realmId}}',
        VendorRef: {
            value: '{{vendorId}}',
        },
        TotalAmt: 50.0,
        PayType: 'Check',
        CheckPayment: {
            BankAccountRef: {
                value: '35',
            },
        },
        Line: [
            {
                Amount: 50.0,
                LinkedTxn: [
                    {
                        TxnId: '{{billId}}',
                        TxnType: 'Bill',
                    },
                ],
            },
        ],
    },

    'billPayment/update': {
        realmId: '{{realmId}}',
        id: '{{billPaymentId}}',
        syncToken: '{{billPaymentSyncToken}}',
        VendorRef: {
            value: '{{vendorId}}',
        },
        TotalAmt: 50.0,
        PayType: 'Check',
        CheckPayment: {
            BankAccountRef: {
                value: '35',
            },
        },
        Line: [
            {
                Amount: 50.0,
                LinkedTxn: [
                    {
                        TxnId: '{{billId}}',
                        TxnType: 'Bill',
                    },
                ],
            },
        ],
    },

    // Budget
    'budget/create': {
        realmId: '{{realmId}}',
        Name: 'FY Budget Postman Test {{timestamp}}',
        StartDate: '2026-01-01',
        EndDate: '2026-12-31',
        BudgetEntryType: 'Monthly',
    },

    'budget/update': {
        realmId: '{{realmId}}',
        id: '{{budgetId}}',
        syncToken: '{{budgetSyncToken}}',
        Name: 'FY Budget Updated {{timestamp}}',
    },

    // ChangeDataCapture
    'changeDataCapture/get': {
        realmId: '{{realmId}}',
        entities: 'Customer,Invoice',
        changedSince: '2026-01-01T00:00:00Z',
    },

    // ChangeOrder
    'changeOrder/create': {
        realmId: '{{realmId}}',
        ChangeOrderType: 'Internal',
        Description: 'Postman Test Change Order {{timestamp}}',
    },

    'changeOrder/update': {
        realmId: '{{realmId}}',
        id: '{{changeOrderId}}',
        syncToken: '{{changeOrderSyncToken}}',
        Description: 'Updated Change Order {{timestamp}}',
    },

    // Class
    'class/create': {
        realmId: '{{realmId}}',
        Name: 'Postman Test Class {{timestamp}}',
    },

    'class/update': {
        realmId: '{{realmId}}',
        id: '{{classId}}',
        syncToken: '{{classSyncToken}}',
        Name: 'Postman Test Class Updated {{timestamp}}',
    },

    'class/delete': {
        realmId: '{{realmId}}',
        id: '{{classId}}',
        syncToken: '{{classSyncToken}}',
        Name: '{{className}}',
    },

    // CompanyInfo
    'companyInfo/get': {
        realmId: '{{realmId}}',
    },

    'companyInfo/update': {
        realmId: '{{realmId}}',
        id: '{{companyInfoId}}',
        syncToken: '{{companyInfoSyncToken}}',
        CompanyName: 'Postman Test Company Updated',
        CompanyAddr: {
            Line1: 'Postman Test Address',
            City: 'Phoenix',
            CountrySubDivisionCode: 'AZ',
            PostalCode: '85001',
        },
    },

    // CreditMemo
    'creditMemo/create': {
        realmId: '{{realmId}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Line: [
            {
                Amount: 50.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    'creditMemo/update': {
        realmId: '{{realmId}}',
        id: '{{creditMemoId}}',
        syncToken: '{{creditMemoSyncToken}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Line: [
            {
                Amount: 50.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    // CreditCardPayment
    'creditCardPayment/create': {
        realmId: '{{realmId}}',
        BankAccountRef: {
            value: '35',
        },
        CreditCardAccountRef: {
            value: '42',
        },
        Amount: 100.0,
    },

    // Customer
    'customer/create': {
        realmId: '{{realmId}}',
        DisplayName: 'Postman Test Customer {{timestamp}}',
        GivenName: 'Test',
        FamilyName: 'Customer',
        PrimaryEmailAddr: {
            Address: 'customer-{{timestamp}}@example.com',
        },
    },

    'customer/update': {
        realmId: '{{realmId}}',
        id: '{{customerId}}',
        syncToken: '{{customerSyncToken}}',
        DisplayName: 'Postman Test Customer Updated {{timestamp}}',
    },

    'customer/delete': {
        realmId: '{{realmId}}',
        id: '{{customerId}}',
        syncToken: '{{customerSyncToken}}',
        DisplayName: '{{customerDisplayName}}',
    },

    // CustomerType
    'customerType/create': {
        realmId: '{{realmId}}',
        Name: 'Retail Customer Postman Test {{timestamp}}',
    },

    'customerType/update': {
        realmId: '{{realmId}}',
        id: '{{customerTypeId}}',
        syncToken: '{{customerTypeSyncToken}}',
        Name: 'Retail Customer Updated {{timestamp}}',
    },

    'customerType/delete': {
        realmId: '{{realmId}}',
        id: '{{customerTypeId}}',
        syncToken: '{{customerTypeSyncToken}}',
        Name: '{{customerTypeName}}',
    },

    // Department
    'department/create': {
        realmId: '{{realmId}}',
        Name: 'Marketing Department Postman Test {{timestamp}}',
    },

    'department/update': {
        realmId: '{{realmId}}',
        id: '{{departmentId}}',
        syncToken: '{{departmentSyncToken}}',
        Name: 'Marketing Department Updated {{timestamp}}',
    },

    'department/delete': {
        realmId: '{{realmId}}',
        id: '{{departmentId}}',
        syncToken: '{{departmentSyncToken}}',
        Name: '{{departmentName}}',
    },

    // Deposit
    'deposit/create': {
        realmId: '{{realmId}}',
        DepositToAccountRef: {
            value: '35',
        },
        Line: [
            {
                Amount: 100.0,
                DetailType: 'DepositLineDetail',
                DepositLineDetail: {
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
        ],
    },

    'deposit/update': {
        realmId: '{{realmId}}',
        id: '{{depositId}}',
        syncToken: '{{depositSyncToken}}',
        DepositToAccountRef: {
            value: '35',
        },
        Line: [
            {
                Amount: 100.0,
                DetailType: 'DepositLineDetail',
                DepositLineDetail: {
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
        ],
    },

    // Employee
    'employee/create': {
        realmId: '{{realmId}}',
        GivenName: 'Jane',
        FamilyName: 'Doe',
        DisplayName: 'Jane Doe Postman Test {{timestamp}}',
    },

    'employee/update': {
        realmId: '{{realmId}}',
        id: '{{employeeId}}',
        syncToken: '{{employeeSyncToken}}',
        GivenName: 'Jane',
        FamilyName: 'Updated',
        DisplayName: 'Jane Doe Updated {{timestamp}}',
    },

    'employee/delete': {
        realmId: '{{realmId}}',
        id: '{{employeeId}}',
        syncToken: '{{employeeSyncToken}}',
        DisplayName: '{{employeeDisplayName}}',
    },

    // Entitlements
    'entitlements/get': {
        realmId: '{{realmId}}',
    },

    // Estimate
    'estimate/create': {
        realmId: '{{realmId}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Line: [
            {
                Amount: 100.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    'estimate/update': {
        realmId: '{{realmId}}',
        id: '{{estimateId}}',
        syncToken: '{{estimateSyncToken}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Line: [
            {
                Amount: 110.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    // ExchangeRate
    'exchangeRate/get': {
        realmId: '{{realmId}}',
        sourcecurrencycode: 'EUR',
    },

    // InventoryAdjustment
    'inventoryAdjustment/create': {
        realmId: '{{realmId}}',
        AdjustAccountRef: {
            value: '{{accountId}}',
        },
        Line: [
            {
                DetailType: 'ItemAdjustmentLineDetail',
                ItemAdjustmentLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                    QtyDiff: 1,
                },
            },
        ],
    },

    'inventoryAdjustment/update': {
        realmId: '{{realmId}}',
        id: '{{inventoryAdjustmentId}}',
        syncToken: '{{inventoryAdjustmentSyncToken}}',
        AdjustAccountRef: {
            value: '{{accountId}}',
        },
        Line: [
            {
                DetailType: 'ItemAdjustmentLineDetail',
                ItemAdjustmentLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                    QtyDiff: 2,
                },
            },
        ],
    },

    // Invoice
    'invoice/create': {
        realmId: '{{realmId}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Line: [
            {
                Amount: 100.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    'invoice/update': {
        realmId: '{{realmId}}',
        id: '{{invoiceId}}',
        syncToken: '{{invoiceSyncToken}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Line: [
            {
                Amount: 120.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    // Item
    'item/create': {
        realmId: '{{realmId}}',
        Name: 'Postman Test Item {{timestamp}}',
        Type: 'Service',
        IncomeAccountRef: {
            value: '1',
        },
    },

    'item/update': {
        realmId: '{{realmId}}',
        id: '{{itemId}}',
        syncToken: '{{itemSyncToken}}',
        Name: 'Postman Test Item Updated {{timestamp}}',
        Type: 'Service',
        IncomeAccountRef: {
            value: '1',
        },
    },

    'item/delete': {
        realmId: '{{realmId}}',
        id: '{{itemId}}',
        syncToken: '{{itemSyncToken}}',
        Name: '{{itemName}}',
        Type: 'Service',
    },

    // JournalEntry
    'journalEntry/create': {
        realmId: '{{realmId}}',
        Line: [
            {
                Amount: 100.0,
                DetailType: 'JournalEntryLineDetail',
                JournalEntryLineDetail: {
                    PostingType: 'Debit',
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
            {
                Amount: 100.0,
                DetailType: 'JournalEntryLineDetail',
                JournalEntryLineDetail: {
                    PostingType: 'Credit',
                    AccountRef: {
                        value: '35',
                    },
                },
            },
        ],
    },

    'journalEntry/update': {
        realmId: '{{realmId}}',
        id: '{{journalEntryId}}',
        syncToken: '{{journalEntrySyncToken}}',
        Line: [
            {
                Amount: 100.0,
                DetailType: 'JournalEntryLineDetail',
                JournalEntryLineDetail: {
                    PostingType: 'Debit',
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
            {
                Amount: 100.0,
                DetailType: 'JournalEntryLineDetail',
                JournalEntryLineDetail: {
                    PostingType: 'Credit',
                    AccountRef: {
                        value: '35',
                    },
                },
            },
        ],
    },

    // Payment
    'payment/create': {
        realmId: '{{realmId}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        TotalAmt: 100.0,
    },

    'payment/update': {
        realmId: '{{realmId}}',
        id: '{{paymentId}}',
        syncToken: '{{paymentSyncToken}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        TotalAmt: 100.0,
    },

    // PaymentMethod
    'paymentMethod/create': {
        realmId: '{{realmId}}',
        Name: 'Credit Card Postman Test {{timestamp}}',
        Type: 'CREDIT_CARD',
    },

    'paymentMethod/update': {
        realmId: '{{realmId}}',
        id: '{{paymentMethodId}}',
        syncToken: '{{paymentMethodSyncToken}}',
        Name: 'Credit Card Updated {{timestamp}}',
    },

    'paymentMethod/delete': {
        realmId: '{{realmId}}',
        id: '{{paymentMethodId}}',
        syncToken: '{{paymentMethodSyncToken}}',
        Name: '{{paymentMethodName}}',
    },

    // Preferences
    'preferences/get': {
        realmId: '{{realmId}}',
    },

    'preferences/update': {
        realmId: '{{realmId}}',
        EmailMessagesPrefs: {
            CustomerSalutationType: 'Title',
        },
    },

    // Purchase
    'purchase/create': {
        realmId: '{{realmId}}',
        AccountRef: {
            value: '35',
        },
        PaymentType: 'Cash',
        Line: [
            {
                Amount: 25.0,
                DetailType: 'AccountBasedExpenseLineDetail',
                AccountBasedExpenseLineDetail: {
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
        ],
    },

    'purchase/update': {
        realmId: '{{realmId}}',
        id: '{{purchaseId}}',
        syncToken: '{{purchaseSyncToken}}',
        AccountRef: {
            value: '35',
        },
        PaymentType: 'Cash',
        Line: [
            {
                Amount: 30.0,
                DetailType: 'AccountBasedExpenseLineDetail',
                AccountBasedExpenseLineDetail: {
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
        ],
    },

    'purchaseOrder/create': {
        realmId: '{{realmId}}',
        VendorRef: {
            value: '{{vendorId}}',
        },
        Line: [
            {
                Amount: 100.0,
                DetailType: 'ItemBasedExpenseLineDetail',
                ItemBasedExpenseLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    'purchaseOrder/update': {
        realmId: '{{realmId}}',
        id: '{{purchaseOrderId}}',
        syncToken: '{{purchaseOrderSyncToken}}',
        VendorRef: {
            value: '{{vendorId}}',
        },
        Line: [
            {
                Amount: 120.0,
                DetailType: 'ItemBasedExpenseLineDetail',
                ItemBasedExpenseLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    // RecurringTransaction
    'recurringTransaction/create': {
        realmId: '{{realmId}}',
        Name: 'Monthly Recurring Invoice Test {{timestamp}}',
    },

    'recurringTransaction/update': {
        realmId: '{{realmId}}',
        id: '{{recurringTransactionId}}',
        syncToken: '{{recurringTransactionSyncToken}}',
        Name: 'Monthly Recurring Invoice Updated {{timestamp}}',
    },

    // RefundReceipt
    'refundReceipt/create': {
        realmId: '{{realmId}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        DepositToAccountRef: {
            value: '35',
        },
        Line: [
            {
                Amount: 50.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    'refundReceipt/update': {
        realmId: '{{realmId}}',
        id: '{{refundReceiptId}}',
        syncToken: '{{refundReceiptSyncToken}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        DepositToAccountRef: {
            value: '35',
        },
        Line: [
            {
                Amount: 50.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    // ReimburseCharge
    'reimburseCharge/create': {
        realmId: '{{realmId}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Amount: 25.0,
    },

    'reimburseCharge/update': {
        realmId: '{{realmId}}',
        id: '{{reimburseChargeId}}',
        syncToken: '{{reimburseChargeSyncToken}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Amount: 30.0,
    },

    // SalesReceipt
    'salesReceipt/create': {
        realmId: '{{realmId}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Line: [
            {
                Amount: 100.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    'salesReceipt/update': {
        realmId: '{{realmId}}',
        id: '{{salesReceiptId}}',
        syncToken: '{{salesReceiptSyncToken}}',
        CustomerRef: {
            value: '{{customerId}}',
        },
        Line: [
            {
                Amount: 100.0,
                DetailType: 'SalesItemLineDetail',
                SalesItemLineDetail: {
                    ItemRef: {
                        value: '{{itemId}}',
                    },
                },
            },
        ],
    },

    // TaxClassification
    'taxClassification/get': {
        realmId: '{{realmId}}',
    },

    // TaxCode
    'taxCode/create': {
        realmId: '{{realmId}}',
        Name: 'PostmanTaxCode {{timestamp}}',
        Taxable: true,
        TaxGroup: false,
    },

    'taxCode/update': {
        realmId: '{{realmId}}',
        id: '{{taxCodeId}}',
        syncToken: '{{taxCodeSyncToken}}',
        Name: 'PostmanTaxCodeUpdated {{timestamp}}',
    },

    'taxCode/delete': {
        realmId: '{{realmId}}',
        id: '{{taxCodeId}}',
        syncToken: '{{taxCodeSyncToken}}',
        Name: '{{taxCodeName}}',
    },

    // TaxPayment
    'taxPayment/create': {
        realmId: '{{realmId}}',
        PaymentType: 'TaxPayment',
        Refund: false,
        TotalAmt: 100.0,
    },

    'taxPayment/update': {
        realmId: '{{realmId}}',
        id: '{{taxPaymentId}}',
        syncToken: '{{taxPaymentSyncToken}}',
        PaymentType: 'TaxPayment',
        Refund: false,
        TotalAmt: 100.0,
    },

    // TaxRate
    'taxRate/create': {
        realmId: '{{realmId}}',
        Name: 'State Rate Postman Test {{timestamp}}',
        RateValue: 5.0,
        AgencyRef: {
            value: '{{taxAgencyId}}',
        },
    },

    'taxRate/update': {
        realmId: '{{realmId}}',
        id: '{{taxRateId}}',
        syncToken: '{{taxRateSyncToken}}',
        Name: 'State Rate Updated {{timestamp}}',
        RateValue: 6.0,
    },

    'taxRate/delete': {
        realmId: '{{realmId}}',
        id: '{{taxRateId}}',
        syncToken: '{{taxRateSyncToken}}',
        Name: '{{taxRateName}}',
    },

    // TaxService
    'taxService/get': {
        realmId: '{{realmId}}',
    },

    // TaxAgency
    'taxAgency/create': {
        realmId: '{{realmId}}',
        DisplayName: 'State Tax Agency Postman Test {{timestamp}}',
    },

    'taxAgency/update': {
        realmId: '{{realmId}}',
        id: '{{taxAgencyId}}',
        syncToken: '{{taxAgencySyncToken}}',
        DisplayName: 'State Tax Agency Updated {{timestamp}}',
        Name: 'State Tax Agency Updated {{timestamp}}',
    },

    'taxAgency/delete': {
        realmId: '{{realmId}}',
        id: '{{taxAgencyId}}',
        syncToken: '{{taxAgencySyncToken}}',
        DisplayName: '{{taxAgencyDisplayName}}',
    },

    // Term
    'term/create': {
        realmId: '{{realmId}}',
        Name: 'Net 30 Postman Test {{timestamp}}',
        DueDays: 30,
    },

    'term/update': {
        realmId: '{{realmId}}',
        id: '{{termId}}',
        syncToken: '{{termSyncToken}}',
        Name: 'Net 30 Updated {{timestamp}}',
        DueDays: 30,
    },

    'term/delete': {
        realmId: '{{realmId}}',
        id: '{{termId}}',
        syncToken: '{{termSyncToken}}',
        Name: '{{termName}}',
    },

    // TimeActivity
    'timeActivity/create': {
        realmId: '{{realmId}}',
        NameOf: 'Employee',
        EmployeeRef: {
            value: '{{employeeId}}',
        },
        ItemRef: {
            value: '{{itemId}}',
        },
        Hours: 2,
        Minutes: 30,
    },

    'timeActivity/update': {
        realmId: '{{realmId}}',
        id: '{{timeActivityId}}',
        syncToken: '{{timeActivitySyncToken}}',
        NameOf: 'Employee',
        EmployeeRef: {
            value: '{{employeeId}}',
        },
        ItemRef: {
            value: '{{itemId}}',
        },
        Hours: 3,
        Minutes: 0,
    },

    // Transfer
    'transfer/create': {
        realmId: '{{realmId}}',
        FromAccountRef: {
            value: '35',
        },
        ToAccountRef: {
            value: '36',
        },
        Amount: 50.0,
    },

    'transfer/update': {
        realmId: '{{realmId}}',
        id: '{{transferId}}',
        syncToken: '{{transferSyncToken}}',
        FromAccountRef: {
            value: '35',
        },
        ToAccountRef: {
            value: '36',
        },
        Amount: 60.0,
    },

    // Vendor
    'vendor/create': {
        realmId: '{{realmId}}',
        DisplayName: 'Postman Test Vendor {{timestamp}}',
        CompanyName: 'Test Vendor Co',
        PrimaryEmailAddr: {
            Address: 'vendor-{{timestamp}}@example.com',
        },
    },

    'vendor/update': {
        realmId: '{{realmId}}',
        id: '{{vendorId}}',
        syncToken: '{{vendorSyncToken}}',
        DisplayName: 'Postman Test Vendor Updated {{timestamp}}',
    },

    'vendor/delete': {
        realmId: '{{realmId}}',
        id: '{{vendorId}}',
        syncToken: '{{vendorSyncToken}}',
        DisplayName: '{{vendorDisplayName}}',
    },

    // VendorCredit
    'vendorCredit/create': {
        realmId: '{{realmId}}',
        VendorRef: {
            value: '{{vendorId}}',
        },
        Line: [
            {
                Amount: 50.0,
                DetailType: 'AccountBasedExpenseLineDetail',
                AccountBasedExpenseLineDetail: {
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
        ],
    },

    'vendorCredit/update': {
        realmId: '{{realmId}}',
        id: '{{vendorCreditId}}',
        syncToken: '{{vendorCreditSyncToken}}',
        VendorRef: {
            value: '{{vendorId}}',
        },
        Line: [
            {
                Amount: 50.0,
                DetailType: 'AccountBasedExpenseLineDetail',
                AccountBasedExpenseLineDetail: {
                    AccountRef: {
                        value: '{{accountId}}',
                    },
                },
            },
        ],
    },
};

// Report modules list
const reportModules = new Set([
    'balanceSheet',
    'cashFlow',
    'profitAndLoss',
    'profitAndLossDetail',
    'trialBalance',
    'generalLedger',
    'apAgingDetail',
    'apAgingSummary',
    'arAgingDetail',
    'arAgingSummary',
    'customerBalance',
    'customerBalanceDetail',
    'customerIncome',
    'inventoryValuationDetail',
    'inventoryValuationSummary',
    'journalReport',
    'salesByClassSummary',
    'salesByCustomer',
    'salesByDepartment',
    'salesByProduct',
    'taxSummary',
    'vendorBalance',
    'vendorBalanceDetail',
    'vendorExpenses',
    'transactionList',
    'transactionListByVendor',
    'transactionListByCustomer',
    'transactionListWithSplits',
]);

/**
 * Entity variable and response key mapping
 */
const entityConfig = {
    account: { var: 'account', key: 'Account' },
    attachable: { var: 'attachable', key: 'Attachable' },
    bill: { var: 'bill', key: 'Bill' },
    billPayment: { var: 'billPayment', key: 'BillPayment' },
    budget: { var: 'budget', key: 'Budget' },
    changeOrder: { var: 'changeOrder', key: 'ChangeOrder' },
    class: { var: 'class', key: 'Class' },
    companyInfo: { var: 'companyInfo', key: 'CompanyInfo' },
    creditCardPayment: { var: 'creditCardPayment', key: 'CreditCardPayment' },
    creditMemo: { var: 'creditMemo', key: 'CreditMemo' },
    customer: { var: 'customer', key: 'Customer' },
    customerType: { var: 'customerType', key: 'CustomerType' },
    department: { var: 'department', key: 'Department' },
    deposit: { var: 'deposit', key: 'Deposit' },
    employee: { var: 'employee', key: 'Employee' },
    estimate: { var: 'estimate', key: 'Estimate' },
    inventoryAdjustment: { var: 'inventoryAdjustment', key: 'InventoryAdjustment' },
    invoice: { var: 'invoice', key: 'Invoice' },
    item: { var: 'item', key: 'Item' },
    journalEntry: { var: 'journalEntry', key: 'JournalEntry' },
    payment: { var: 'payment', key: 'Payment' },
    paymentMethod: { var: 'paymentMethod', key: 'PaymentMethod' },
    preferences: { var: 'preferences', key: 'Preferences' },
    purchase: { var: 'purchase', key: 'Purchase' },
    purchaseOrder: { var: 'purchaseOrder', key: 'PurchaseOrder' },
    recurringTransaction: { var: 'recurringTransaction', key: 'RecurringTransaction' },
    refundReceipt: { var: 'refundReceipt', key: 'RefundReceipt' },
    reimburseCharge: { var: 'reimburseCharge', key: 'ReimburseCharge' },
    salesReceipt: { var: 'salesReceipt', key: 'SalesReceipt' },
    taxAgency: { var: 'taxAgency', key: 'TaxAgency' },
    taxClassification: { var: 'taxClassification', key: 'TaxClassification' },
    taxCode: { var: 'taxCode', key: 'TaxCode' },
    taxPayment: { var: 'taxPayment', key: 'TaxPayment' },
    taxRate: { var: 'taxRate', key: 'TaxRate' },
    taxService: { var: 'taxService', key: 'TaxService' },
    term: { var: 'term', key: 'Term' },
    timeActivity: { var: 'timeActivity', key: 'TimeActivity' },
    transfer: { var: 'transfer', key: 'Transfer' },
    vendor: { var: 'vendor', key: 'Vendor' },
    vendorCredit: { var: 'vendorCredit', key: 'VendorCredit' },
};

// Module execution priority order (Master data first -> Transactions -> Reports)
const moduleOrder = [
    // 1. Foundational Master Data
    'account',
    'customer',
    'vendor',
    'item',
    'taxAgency',
    'taxRate',
    'taxCode',
    'taxClassification',
    'taxService',
    'taxPayment',
    'term',
    'paymentMethod',
    'department',
    'class',
    'employee',
    'companyInfo',
    'companyCurrency',
    'customerType',
    'preferences',

    // 2. Transactions & Operations
    'estimate',
    'invoice',
    'payment',
    'creditMemo',
    'salesReceipt',
    'refundReceipt',
    'reimburseCharge',
    'creditCardPayment',
    'bill',
    'billPayment',
    'purchase',
    'purchaseOrder',
    'vendorCredit',
    'deposit',
    'transfer',
    'journalEntry',
    'inventoryAdjustment',
    'timeActivity',
    'budget',
    'changeOrder',
    'recurringTransaction',
    'attachable',
    'batch',

    // 3. Reports & Analytics
    'accountListDetail',
    'apAgingDetail',
    'apAgingSummary',
    'arAgingDetail',
    'arAgingSummary',
    'balanceSheet',
    'cashFlow',
    'changeDataCapture',
    'customerBalance',
    'customerBalanceDetail',
    'customerIncome',
    'entitlements',
    'exchangeRate',
    'generalLedger',
    'inventoryValuationDetail',
    'inventoryValuationSummary',
    'journalReport',
    'profitAndLoss',
    'profitAndLossDetail',
    'salesByClassSummary',
    'salesByCustomer',
    'salesByDepartment',
    'salesByProduct',
    'taxSummary',
    'transactionList',
    'transactionListByCustomer',
    'transactionListByVendor',
    'transactionListWithSplits',
    'trialBalance',
    'vendorBalance',
    'vendorBalanceDetail',
    'vendorExpenses',
];

function getActionRank(action) {
    if (action === 'create' || action.startsWith('create')) return 1;
    if (action === 'get' || action === 'read' || action === 'status' || action === 'pdf') return 2;
    if (action === 'getMany' || action === 'query' || action === 'find' || action === 'list') return 3;
    if (action === 'update' || action === 'reopen' || action === 'close' || action === 'sync') return 4;
    if (action === 'delete' || action === 'void') return 5;
    return 6;
}

function sortRoutes(routes) {
    return [...routes].sort((a, b) => {
        const [modA, actA] = a.split('/');
        const [modB, actB] = b.split('/');

        const idxA = moduleOrder.indexOf(modA);
        const idxB = moduleOrder.indexOf(modB);

        const orderA = idxA === -1 ? 999 : idxA;
        const orderB = idxB === -1 ? 999 : idxB;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        if (modA !== modB) {
            return modA.localeCompare(modB);
        }

        const rankA = getActionRank(actA);
        const rankB = getActionRank(actB);

        if (rankA !== rankB) {
            return rankA - rankB;
        }

        return actA.localeCompare(actB);
    });
}

const businessRoutes = sortRoutes(rawBusinessRoutes);

/**
 * Get request body for any route
 */
function getRequestBody(route) {
    if (customBodies[route]) {
        return customBodies[route];
    }

    const [module, action] = route.split('/');

    if (reportModules.has(module)) {
        return {
            realmId: '{{realmId}}',
            start_date: '2026-01-01',
            end_date: '2026-09-21',
        };
    }

    const varName = (entityConfig[module] && entityConfig[module].var) || module;

    if (action === 'get' || action === 'send') {
        return {
            realmId: '{{realmId}}',
            id: `{{${varName}Id}}`,
        };
    }

    if (action === 'getMany' || action === 'query') {
        return {
            realmId: '{{realmId}}',
            maxResults: 10,
        };
    }

    if (action === 'delete') {
        return {
            realmId: '{{realmId}}',
            id: `{{${varName}Id}}`,
            syncToken: `{{${varName}SyncToken}}`,
        };
    }

    if (action === 'update') {
        return {
            realmId: '{{realmId}}',
            id: `{{${varName}Id}}`,
            syncToken: `{{${varName}SyncToken}}`,
            Name: 'Postman Test Updated {{timestamp}}',
        };
    }

    if (action === 'create') {
        return {
            realmId: '{{realmId}}',
            Name: 'Postman Test {{timestamp}}',
        };
    }

    return {
        realmId: '{{realmId}}',
    };
}

/**
 * Determine internal QuickBooks HTTP method for a business action
 */
function determineQuickBooksMethod(module, action) {
    if (
        action === 'create' ||
        action === 'update' ||
        action === 'delete' ||
        action === 'send'
    ) {
        return 'POST';
    }
    if (
        action === 'get' ||
        action === 'getMany' ||
        action === 'query'
    ) {
        return 'GET';
    }
    if (reportModules.has(module)) {
        return 'GET';
    }
    return 'POST';
}

/**
 * Get common business request body format
 */
function getBusinessRequestBody(route) {
    const [module, action] = route.split('/');
    const existingBody = getRequestBody(route);

    const {
        realmId,
        ...data
    } = existingBody;

    return {
        realmId: realmId || '{{realmId}}',
        module,
        action,
        method: determineQuickBooksMethod(module, action),
        data,
    };
}

/**
 * Create variable-capture script for CREATE and UPDATE responses.
 */
function createVariableCaptureScript(route) {
    const [module, action] = route.split('/');
    const conf = entityConfig[module];
    if (!conf) return [];

    const varName = conf.var || module;
    const entityKey = conf.key || (module.charAt(0).toUpperCase() + module.slice(1));

    const shouldCapture =
        action === 'create' ||
        action === 'update' ||
        action === 'get' ||
        (module === 'companyInfo' && action === 'get');

    if (!shouldCapture) {
        return [];
    }

    return [
        '',
        `// Capture ${varName} variables from response.${entityKey}`,
        'try {',
        '    if (isSuccess && responseJson) {',
        '        const target = responseJson.response || responseJson;',
        `        let entity = target ? target["${entityKey}"] : null;`,
        '        if (!entity && target && typeof target === "object") {',
        `            const lowerKey = "${module}".toLowerCase();`,
        '            for (const k of Object.keys(target)) {',
        '                if (k.toLowerCase() === lowerKey) { entity = target[k]; break; }',
        '            }',
        '            if (!entity && (target.Id || target.id)) { entity = target; }',
        '        }',
        '        if (entity && (entity.Id || entity.id)) {',
        '            const entId = entity.Id || entity.id;',
        '            const entSync = entity.SyncToken !== undefined ? entity.SyncToken : (entity.syncToken !== undefined ? entity.syncToken : "0");',
        `            pm.collectionVariables.set("${varName}Id", String(entId));`,
        `            pm.collectionVariables.set("${varName}SyncToken", String(entSync));`,
        '            if (entity.DisplayName || entity.displayName) {',
        `                pm.collectionVariables.set("${varName}DisplayName", String(entity.DisplayName || entity.displayName));`,
        '            }',
        '            if (entity.Name || entity.name) {',
        `                pm.collectionVariables.set("${varName}Name", String(entity.Name || entity.name));`,
        '            }',
        `            console.log("Captured ${varName}Id:", entId, "${varName}SyncToken:", entSync);`,
        '        }',
        '    }',
        '} catch (e) {',
        `    console.log("Could not capture ${varName} variables:", e.message);`,
        '}',
    ];
}

/**
 * Create Postman item
 */
function createPostmanItem(route) {
    const isBusinessRoute =
        !route.startsWith('oauth/') &&
        !route.startsWith('credentials/');
    const bodyData = isBusinessRoute
        ? getBusinessRequestBody(route)
        : getRequestBody(route);

    const testScript = [
        'const status = pm.response.code;',
        'const requestName = pm.info.requestName;',
        '',
        'let responseJson = null;',
        'try {',
        '    responseJson = pm.response.json();',
        '} catch (e) {',
        '    responseJson = null;',
        '}',
        '',
        'const isSuccess = [200, 201].includes(status);',
        '',
        ...createVariableCaptureScript(route),
        '',
        'if (isSuccess) {',
        '    let passed = Number(pm.collectionVariables.get("passedCount") || 0);',
        '    pm.collectionVariables.set("passedCount", passed + 1);',
        '',
        '    console.log("PASSED REQUEST:", requestName);',
        '    console.log("STATUS:", status);',
        '} else {',
        '    let failed = Number(pm.collectionVariables.get("failedCount") || 0);',
        '    pm.collectionVariables.set("failedCount", failed + 1);',
        '',
        '    console.log("FAILED REQUEST:", requestName);',
        '    console.log("STATUS:", status);',
        '    console.log("RESPONSE:", responseJson || pm.response.text());',
        '}',
        '',
        'pm.test(',
        '    (isSuccess ? "PASS - " : "FAIL - ") + requestName,',
        '    function () {',
        '        pm.expect(status).to.be.oneOf([200, 201]);',
        '    }',
        ');',
    ];

    return {
        name: route,

        event: [
            {
                listen: 'test',

                script: {
                    type: 'text/javascript',
                    exec: testScript,
                },
            },
        ],

        request: {
            method: 'POST',

            header: [
                {
                    key: 'Content-Type',
                    value: 'application/json',
                    type: 'text',
                },
            ],

            body: {
                mode: 'raw',

                raw: JSON.stringify(
                    bodyData,
                    null,
                    2,
                ),

                options: {
                    raw: {
                        language: 'json',
                    },
                },
            },

            url: {
                raw:
                    '{{baseUrl}}/quickbooks/' +
                    route,

                host: [
                    '{{baseUrl}}',
                ],

                path: [
                    'quickbooks',
                    ...route.split('/'),
                ],
            },
        },

        response: [],
    };
}

const moduleFolderNames = {
    account: 'Account',
    accountListDetail: 'Account List Detail',
    apAgingDetail: 'AP Aging Detail',
    apAgingSummary: 'AP Aging Summary',
    arAgingDetail: 'AR Aging Detail',
    arAgingSummary: 'AR Aging Summary',
    attachable: 'Attachable',
    balanceSheet: 'Balance Sheet',
    batch: 'Batch',
    bill: 'Bill',
    billPayment: 'Bill Payment',
    budget: 'Budget',
    cashFlow: 'Cash Flow',
    changeDataCapture: 'Change Data Capture',
    changeOrder: 'Change Order',
    class: 'Class',
    companyCurrency: 'Company Currency',
    companyInfo: 'Company Info',
    creditMemo: 'Credit Memo',
    creditCardPayment: 'Credit Card Payment',
    customer: 'Customer',
    customerBalance: 'Customer Balance',
    customerBalanceDetail: 'Customer Balance Detail',
    customerIncome: 'Customer Income',
    customerType: 'Customer Type',
    department: 'Department',
    deposit: 'Deposit',
    employee: 'Employee',
    entitlements: 'Entitlements',
    estimate: 'Estimate',
    exchangeRate: 'Exchange Rate',
    generalLedger: 'General Ledger',
    inventoryAdjustment: 'Inventory Adjustment',
    inventoryValuationDetail: 'Inventory Valuation Detail',
    inventoryValuationSummary: 'Inventory Valuation Summary',
    invoice: 'Invoice',
    item: 'Item',
    journalEntry: 'Journal Entry',
    journalReport: 'Journal Report',
    payment: 'Payment',
    paymentMethod: 'Payment Method',
    preferences: 'Preferences',
    profitAndLoss: 'Profit and Loss',
    profitAndLossDetail: 'Profit and Loss Detail',
    purchase: 'Purchase',
    purchaseOrder: 'Purchase Order',
    recurringTransaction: 'Recurring Transaction',
    refundReceipt: 'Refund Receipt',
    reimburseCharge: 'Reimburse Charge',
    salesByClassSummary: 'Sales by Class Summary',
    salesByCustomer: 'Sales by Customer',
    salesByDepartment: 'Sales by Department',
    salesByProduct: 'Sales by Product',
    salesReceipt: 'Sales Receipt',
    taxClassification: 'Tax Classification',
    taxCode: 'Tax Code',
    taxPayment: 'Tax Payment',
    taxRate: 'Tax Rate',
    taxService: 'Tax Service',
    taxSummary: 'Tax Summary',
    taxAgency: 'Tax Agency',
    term: 'Term',
    timeActivity: 'Time Activity',
    transactionList: 'Transaction List',
    transactionListByVendor: 'Transaction List by Vendor',
    transactionListByCustomer: 'Transaction List by Customer',
    transactionListWithSplits: 'Transaction List With Splits',
    transfer: 'Transfer',
    trialBalance: 'Trial Balance',
    vendor: 'Vendor',
    vendorBalance: 'Vendor Balance',
    vendorBalanceDetail: 'Vendor Balance Detail',
    vendorCredit: 'Vendor Credit',
    vendorExpenses: 'Vendor Expenses',
};

// Build folders
const oauthFolder = {
    name: 'OAuth APIs',
    item: oauthRoutes.map(createPostmanItem),
};

const credentialsFolder = {
    name: 'Credentials APIs',
    item: credentialRoutes.map(createPostmanItem),
};

// Group business routes by module
const moduleGroups = {};
for (const route of rawBusinessRoutes) {
    const [moduleName] = route.split('/');
    if (!moduleGroups[moduleName]) {
        moduleGroups[moduleName] = [];
    }
    moduleGroups[moduleName].push(route);
}

const businessModuleFolders = Object.keys(moduleGroups).map((moduleName) => {
    return {
        name: moduleFolderNames[moduleName] || moduleName,
        item: moduleGroups[moduleName].map(createPostmanItem),
    };
});

const businessFolder = {
    name: 'QuickBooks Business APIs',
    item: businessModuleFolders,
};

const businessRequestCount = businessModuleFolders.reduce(
    (sum, folder) => sum + folder.item.length,
    0,
);

const totalRequests =
    oauthFolder.item.length +
    credentialsFolder.item.length +
    businessRequestCount;

const collection = {
    info: {
        _postman_id:
            'quickbooks-nestjs-api-collection',

        name:
            'QuickBooks NestJS API',

        description:
            'Complete QuickBooks NestJS API Collection with OAuth APIs (3), Credentials APIs (4), and QuickBooks Business APIs (219).',

        schema:
            'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },

    variable: [
        { key: 'baseUrl', value: 'http://localhost:3000' },
        { key: 'realmId', value: '9341457916724495' },
        { key: 'passedCount', value: '0' },
        { key: 'failedCount', value: '0' },
        { key: 'timestamp', value: '{{$timestamp}}' },
        { key: 'accountId', value: '1' },
        { key: 'accountSyncToken', value: '0' },
        { key: 'accountName', value: 'Postman Test Account' },
        { key: 'customerId', value: '1' },
        { key: 'customerSyncToken', value: '0' },
        { key: 'customerDisplayName', value: 'Postman Test Customer' },
        { key: 'vendorId', value: '1' },
        { key: 'vendorSyncToken', value: '0' },
        { key: 'vendorDisplayName', value: 'Postman Test Vendor' },
        { key: 'itemId', value: '1' },
        { key: 'itemSyncToken', value: '0' },
        { key: 'itemName', value: 'Postman Test Item' },
        { key: 'taxAgencyId', value: '1' },
        { key: 'taxAgencySyncToken', value: '0' },
        { key: 'taxAgencyDisplayName', value: 'State Tax Agency Postman Test' },
        { key: 'taxRateId', value: '1' },
        { key: 'taxRateSyncToken', value: '0' },
        { key: 'taxRateName', value: 'State Rate Postman Test' },
        { key: 'taxCodeId', value: '1' },
        { key: 'taxCodeSyncToken', value: '0' },
        { key: 'taxCodeName', value: 'PostmanTaxCode' },
        { key: 'termId', value: '1' },
        { key: 'termSyncToken', value: '0' },
        { key: 'termName', value: 'Net 30 Postman Test' },
        { key: 'paymentMethodId', value: '1' },
        { key: 'paymentMethodSyncToken', value: '0' },
        { key: 'paymentMethodName', value: 'Credit Card Postman Test' },
        { key: 'departmentId', value: '1' },
        { key: 'departmentSyncToken', value: '0' },
        { key: 'departmentName', value: 'Marketing Department Postman Test' },
        { key: 'classId', value: '1' },
        { key: 'classSyncToken', value: '0' },
        { key: 'className', value: 'Postman Test Class' },
        { key: 'employeeId', value: '1' },
        { key: 'employeeSyncToken', value: '0' },
        { key: 'employeeDisplayName', value: 'Jane Doe Postman Test' },
        { key: 'customerTypeId', value: '1' },
        { key: 'customerTypeSyncToken', value: '0' },
        { key: 'customerTypeName', value: 'Retail Customer Postman Test' },
        { key: 'companyInfoId', value: '1' },
        { key: 'companyInfoSyncToken', value: '0' },
        { key: 'companyCurrencyId', value: '1' },
        { key: 'companyCurrencySyncToken', value: '0' },
        { key: 'estimateId', value: '1' },
        { key: 'estimateSyncToken', value: '0' },
        { key: 'invoiceId', value: '1' },
        { key: 'invoiceSyncToken', value: '0' },
        { key: 'paymentId', value: '1' },
        { key: 'paymentSyncToken', value: '0' },
        { key: 'creditMemoId', value: '1' },
        { key: 'creditMemoSyncToken', value: '0' },
        { key: 'salesReceiptId', value: '1' },
        { key: 'salesReceiptSyncToken', value: '0' },
        { key: 'refundReceiptId', value: '1' },
        { key: 'refundReceiptSyncToken', value: '0' },
        { key: 'reimburseChargeId', value: '1' },
        { key: 'reimburseChargeSyncToken', value: '0' },
        { key: 'creditCardPaymentId', value: '1' },
        { key: 'creditCardPaymentSyncToken', value: '0' },
        { key: 'billId', value: '1' },
        { key: 'billSyncToken', value: '0' },
        { key: 'billPaymentId', value: '1' },
        { key: 'billPaymentSyncToken', value: '0' },
        { key: 'purchaseId', value: '1' },
        { key: 'purchaseSyncToken', value: '0' },
        { key: 'purchaseOrderId', value: '1' },
        { key: 'purchaseOrderSyncToken', value: '0' },
        { key: 'vendorCreditId', value: '1' },
        { key: 'vendorCreditSyncToken', value: '0' },
        { key: 'depositId', value: '1' },
        { key: 'depositSyncToken', value: '0' },
        { key: 'transferId', value: '1' },
        { key: 'transferSyncToken', value: '0' },
        { key: 'journalEntryId', value: '1' },
        { key: 'journalEntrySyncToken', value: '0' },
        { key: 'inventoryAdjustmentId', value: '1' },
        { key: 'inventoryAdjustmentSyncToken', value: '0' },
        { key: 'timeActivityId', value: '1' },
        { key: 'timeActivitySyncToken', value: '0' },
        { key: 'budgetId', value: '1' },
        { key: 'budgetSyncToken', value: '0' },
        { key: 'changeOrderId', value: '1' },
        { key: 'changeOrderSyncToken', value: '0' },
        { key: 'recurringTransactionId', value: '1' },
        { key: 'recurringTransactionSyncToken', value: '0' },
        { key: 'attachableId', value: '1' },
        { key: 'attachableSyncToken', value: '0' },
        { key: 'taxPaymentId', value: '1' },
        { key: 'taxPaymentSyncToken', value: '0' },
    ],

    item: [
        oauthFolder,
        credentialsFolder,
        businessFolder,
    ],
};

fs.writeFileSync(
    outputPath,
    JSON.stringify(
        collection,
        null,
        2,
    ),
    'utf8',
);

console.log(
    `Generated ${totalRequests} API requests.`,
);

console.log(
    `- OAuth APIs: ${oauthFolder.item.length}`,
);

console.log(
    `- Credentials APIs: ${credentialsFolder.item.length}`,
);

console.log(
    `- QuickBooks Business APIs: ${businessRequestCount}`,
);

console.log(
    `Total: ${totalRequests}`,
);

console.log(
    `File: ${outputPath}`,
);
