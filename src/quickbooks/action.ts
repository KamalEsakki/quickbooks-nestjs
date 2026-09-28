export const actions = {
  // =========================
  // QuickBooks OAuth
  // =========================

  oauth: {
    authorize: 'authorize',
    callback: 'callback',
    refreshToken: 'refreshToken',
  },

  // =========================
  // Credentials
  // =========================

  credentials: {
    create: 'createCredential',
    get: 'getCredential',
    update: 'updateCredential',
    delete: 'deleteCredential',
  },

  // =========================
  // Accounting APIs
  // =========================

  account: {
    create: 'createAccount',
    query: 'queryAccount',
    get: 'getAccount',
    update: 'updateAccount',
  },

  accountListDetail: {
    get: 'getAccountListDetail',
    getMany: 'getmanyAccountListDetail',
  },

  apAgingDetail: {
    get: 'getAPAgingDetail',
  },

  apAgingSummary: {
    get: 'getAPAgingSummary',
  },

  arAgingDetail: {
    get: 'getARAgingDetail',
  },

  arAgingSummary: {
    get: 'getARAgingSummary',
  },

  attachable: {
    create: 'createAttachable',
    update: 'updateAttachable',
    get: 'getAttachable',
    getMany: 'getmanyAttachable',
    delete: 'deleteAttachable',
  },

  balanceSheet: {
    get: 'getBalanceSheet',
  },

  batch: {
    create: 'createBatch',
  },

  bill: {
    create: 'createBill',
    update: 'updateBill',
    get: 'getBill',
    getMany: 'getmanyBill',
    delete: 'deleteBill',
  },

  billPayment: {
    create: 'createBillPayment',
    update: 'updateBillPayment',
    get: 'getBillPayment',
    getMany: 'getmanyBillPayment',
    delete: 'deleteBillPayment',
  },

  budget: {
    create: 'createBudget',
    update: 'updateBudget',
    get: 'getBudget',
    getMany: 'getmanyBudget',
    delete: 'deleteBudget',
  },

  cashFlow: {
    get: 'getCashFlow',
  },

  changeDataCapture: {
    get: 'getChangeDataCapture',
  },

  changeOrder: {
    create: 'createChangeOrder',
    update: 'updateChangeOrder',
    get: 'getChangeOrder',
    getMany: 'getmanyChangeOrder',
  },

  class: {
    create: 'createClass',
    update: 'updateClass',
    get: 'getClass',
    getMany: 'getmanyClass',
    delete: 'deleteClass',
  },

  companyCurrency: {
    get: 'getCompanyCurrency',
    getMany: 'getmanyCompanyCurrency',
  },

  companyInfo: {
    get: 'getCompanyInfo',
    update: 'updateCompanyInfo',
  },

  creditMemo: {
    create: 'createCreditMemo',
    update: 'updateCreditMemo',
    get: 'getCreditMemo',
    getMany: 'getmanyCreditMemo',
    delete: 'deleteCreditMemo',
  },

  creditCardPayment: {
    create: 'createCreditCardPayment',
    get: 'getCreditCardPayment',
    getMany: 'getmanyCreditCardPayment',
  },

  customer: {
    create: 'createCustomer',
    update: 'updateCustomer',
    get: 'getCustomer',
    getMany: 'getmanyCustomer',
    delete: 'deleteCustomer',
  },

  customerBalance: {
    get: 'getCustomerBalance',
  },

  customerBalanceDetail: {
    get: 'getCustomerBalanceDetail',
  },

  customerIncome: {
    get: 'getCustomerIncome',
  },

  customerType: {
    create: 'createCustomerType',
    update: 'updateCustomerType',
    get: 'getCustomerType',
    getMany: 'getmanyCustomerType',
    delete: 'deleteCustomerType',
  },

  department: {
    create: 'createDepartment',
    update: 'updateDepartment',
    get: 'getDepartment',
    getMany: 'getmanyDepartment',
    delete: 'deleteDepartment',
  },

  deposit: {
    create: 'createDeposit',
    update: 'updateDeposit',
    get: 'getDeposit',
    getMany: 'getmanyDeposit',
    delete: 'deleteDeposit',
  },

  employee: {
    create: 'createEmployee',
    update: 'updateEmployee',
    get: 'getEmployee',
    getMany: 'getmanyEmployee',
    delete: 'deleteEmployee',
  },

  entitlements: {
    get: 'getEntitlements',
  },

  estimate: {
    create: 'createEstimate',
    update: 'updateEstimate',
    get: 'getEstimate',
    getMany: 'getmanyEstimate',
    delete: 'deleteEstimate',
  },

  exchangeRate: {
    get: 'getExchangeRate',
    getMany: 'getmanyExchangeRate',
  },

  generalLedger: {
    get: 'getGeneralLedger',
  },

  inventoryAdjustment: {
    create: 'createInventoryAdjustment',
    update: 'updateInventoryAdjustment',
    get: 'getInventoryAdjustment',
    getMany: 'getmanyInventoryAdjustment',
  },

  inventoryValuationDetail: {
    get: 'getInventoryValuationDetail',
  },

  inventoryValuationSummary: {
    get: 'getInventoryValuationSummary',
  },

  invoice: {
    create: 'createInvoice',
    update: 'updateInvoice',
    get: 'getInvoice',
    getMany: 'getmanyInvoice',
    delete: 'deleteInvoice',
    send: 'sendInvoice',
  },

  item: {
    create: 'createItem',
    update: 'updateItem',
    get: 'getItem',
    getMany: 'getmanyItem',
    delete: 'deleteItem',
  },

  journalEntry: {
    create: 'createJournalEntry',
    update: 'updateJournalEntry',
    get: 'getJournalEntry',
    getMany: 'getmanyJournalEntry',
    delete: 'deleteJournalEntry',
  },

  journalReport: {
    get: 'getJournalReport',
  },

  payment: {
    create: 'createPayment',
    update: 'updatePayment',
    get: 'getPayment',
    getMany: 'getmanyPayment',
    delete: 'deletePayment',
  },

  paymentMethod: {
    create: 'createPaymentMethod',
    update: 'updatePaymentMethod',
    get: 'getPaymentMethod',
    getMany: 'getmanyPaymentMethod',
    delete: 'deletePaymentMethod',
  },

  preferences: {
    get: 'getPreferences',
    update: 'updatePreferences',
  },

  profitAndLoss: {
    get: 'getProfitAndLoss',
  },

  profitAndLossDetail: {
    get: 'getProfitAndLossDetail',
  },

  purchase: {
    create: 'createPurchase',
    update: 'updatePurchase',
    get: 'getPurchase',
    getMany: 'getmanyPurchase',
    delete: 'deletePurchase',
  },

  purchaseOrder: {
    create: 'createPurchaseOrder',
    update: 'updatePurchaseOrder',
    get: 'getPurchaseOrder',
    getMany: 'getmanyPurchaseOrder',
    delete: 'deletePurchaseOrder',
  },

  recurringTransaction: {
    create: 'createRecurringTransaction',
    update: 'updateRecurringTransaction',
    get: 'getRecurringTransaction',
    getMany: 'getmanyRecurringTransaction',
    delete: 'deleteRecurringTransaction',
  },

  refundReceipt: {
    create: 'createRefundReceipt',
    update: 'updateRefundReceipt',
    get: 'getRefundReceipt',
    getMany: 'getmanyRefundReceipt',
    delete: 'deleteRefundReceipt',
  },

  reimburseCharge: {
    create: 'createReimburseCharge',
    update: 'updateReimburseCharge',
    get: 'getReimburseCharge',
    getMany: 'getmanyReimburseCharge',
    delete: 'deleteReimburseCharge',
  },

  salesByClassSummary: {
    get: 'getSalesByClassSummary',
  },

  salesByCustomer: {
    get: 'getSalesByCustomer',
  },

  salesByDepartment: {
    get: 'getSalesByDepartment',
  },

  salesByProduct: {
    get: 'getSalesByProduct',
  },

  salesReceipt: {
    create: 'createSalesReceipt',
    update: 'updateSalesReceipt',
    get: 'getSalesReceipt',
    getMany: 'getmanySalesReceipt',
    delete: 'deleteSalesReceipt',
  },

  taxClassification: {
    get: 'getTaxClassification',
  },

  taxCode: {
    create: 'createTaxCode',
    update: 'updateTaxCode',
    get: 'getTaxCode',
    getMany: 'getmanyTaxCode',
    delete: 'deleteTaxCode',
  },

  taxPayment: {
    create: 'createTaxPayment',
    update: 'updateTaxPayment',
    get: 'getTaxPayment',
    getMany: 'getmanyTaxPayment',
    delete: 'deleteTaxPayment',
  },

  taxRate: {
    create: 'createTaxRate',
    update: 'updateTaxRate',
    get: 'getTaxRate',
    getMany: 'getmanyTaxRate',
    delete: 'deleteTaxRate',
  },

  taxService: {
    get: 'getTaxService',
  },

  taxSummary: {
    get: 'getTaxSummary',
  },

  taxAgency: {
    create: 'createTaxAgency',
    update: 'updateTaxAgency',
    get: 'getTaxAgency',
    getMany: 'getmanyTaxAgency',
    delete: 'deleteTaxAgency',
  },

  term: {
    create: 'createTerm',
    update: 'updateTerm',
    get: 'getTerm',
    getMany: 'getmanyTerm',
    delete: 'deleteTerm',
  },

  timeActivity: {
    create: 'createTimeActivity',
    update: 'updateTimeActivity',
    get: 'getTimeActivity',
    getMany: 'getmanyTimeActivity',
    delete: 'deleteTimeActivity',
  },

  transactionList: {
    get: 'getTransactionList',
  },

  transactionListByVendor: {
    get: 'getTransactionListByVendor',
  },

  transactionListByCustomer: {
    get: 'getTransactionListByCustomer',
  },

  transactionListWithSplits: {
    get: 'getTransactionListWithSplits',
  },

  transfer: {
    create: 'createTransfer',
    update: 'updateTransfer',
    get: 'getTransfer',
    getMany: 'getmanyTransfer',
    delete: 'deleteTransfer',
  },

  trialBalance: {
    get: 'getTrialBalance',
  },

  vendor: {
    create: 'createVendor',
    update: 'updateVendor',
    get: 'getVendor',
    getMany: 'getmanyVendor',
    delete: 'deleteVendor',
  },

  vendorBalance: {
    get: 'getVendorBalance',
  },

  vendorBalanceDetail: {
    get: 'getVendorBalanceDetail',
  },

  vendorCredit: {
    create: 'createVendorCredit',
    update: 'updateVendorCredit',
    get: 'getVendorCredit',
    getMany: 'getmanyVendorCredit',
    delete: 'deleteVendorCredit',
  },

  vendorExpenses: {
    get: 'getVendorExpenses',
  },
};
