import { actions } from './action';

export const XappName = 'QuickBooks';

export const modules = [
  // OAuth
  {
    module: 'oauth',
    actions: Object.keys(actions.oauth),
    triggers: [],
  },

  // Credentials
  {
    module: 'credentials',
    actions: Object.keys(actions.credentials),
    triggers: [],
  },

  // Accounting APIs
  {
    module: 'account',
    actions: Object.keys(actions.account),
    triggers: [],
  },

  {
    module: 'accountListDetail',
    actions: Object.keys(actions.accountListDetail),
    triggers: [],
  },

  {
    module: 'apAgingDetail',
    actions: Object.keys(actions.apAgingDetail),
    triggers: [],
  },

  {
    module: 'apAgingSummary',
    actions: Object.keys(actions.apAgingSummary),
    triggers: [],
  },

  {
    module: 'arAgingDetail',
    actions: Object.keys(actions.arAgingDetail),
    triggers: [],
  },

  {
    module: 'arAgingSummary',
    actions: Object.keys(actions.arAgingSummary),
    triggers: [],
  },

  {
    module: 'attachable',
    actions: Object.keys(actions.attachable),
    triggers: [],
  },

  {
    module: 'balanceSheet',
    actions: Object.keys(actions.balanceSheet),
    triggers: [],
  },

  {
    module: 'batch',
    actions: Object.keys(actions.batch),
    triggers: [],
  },

  {
    module: 'bill',
    actions: Object.keys(actions.bill),
    triggers: [],
  },

  {
    module: 'billPayment',
    actions: Object.keys(actions.billPayment),
    triggers: [],
  },

  {
    module: 'budget',
    actions: Object.keys(actions.budget),
    triggers: [],
  },

  {
    module: 'cashFlow',
    actions: Object.keys(actions.cashFlow),
    triggers: [],
  },

  {
    module: 'changeDataCapture',
    actions: Object.keys(actions.changeDataCapture),
    triggers: [],
  },

  {
    module: 'changeOrder',
    actions: Object.keys(actions.changeOrder),
    triggers: [],
  },

  {
    module: 'class',
    actions: Object.keys(actions.class),
    triggers: [],
  },

  {
    module: 'companyCurrency',
    actions: Object.keys(actions.companyCurrency),
    triggers: [],
  },

  {
    module: 'companyInfo',
    actions: Object.keys(actions.companyInfo),
    triggers: [],
  },

  {
    module: 'creditMemo',
    actions: Object.keys(actions.creditMemo),
    triggers: [],
  },

  {
    module: 'creditCardPayment',
    actions: Object.keys(actions.creditCardPayment),
    triggers: [],
  },

  {
    module: 'customer',
    actions: Object.keys(actions.customer),
    triggers: [],
  },

  {
    module: 'customerBalance',
    actions: Object.keys(actions.customerBalance),
    triggers: [],
  },

  {
    module: 'customerBalanceDetail',
    actions: Object.keys(actions.customerBalanceDetail),
    triggers: [],
  },

  {
    module: 'customerIncome',
    actions: Object.keys(actions.customerIncome),
    triggers: [],
  },

  {
    module: 'customerType',
    actions: Object.keys(actions.customerType),
    triggers: [],
  },

  {
    module: 'department',
    actions: Object.keys(actions.department),
    triggers: [],
  },

  {
    module: 'deposit',
    actions: Object.keys(actions.deposit),
    triggers: [],
  },

  {
    module: 'employee',
    actions: Object.keys(actions.employee),
    triggers: [],
  },

  {
    module: 'entitlements',
    actions: Object.keys(actions.entitlements),
    triggers: [],
  },

  {
    module: 'estimate',
    actions: Object.keys(actions.estimate),
    triggers: [],
  },

  {
    module: 'exchangeRate',
    actions: Object.keys(actions.exchangeRate),
    triggers: [],
  },

  {
    module: 'generalLedger',
    actions: Object.keys(actions.generalLedger),
    triggers: [],
  },

  {
    module: 'inventoryAdjustment',
    actions: Object.keys(actions.inventoryAdjustment),
    triggers: [],
  },

  {
    module: 'inventoryValuationDetail',
    actions: Object.keys(actions.inventoryValuationDetail),
    triggers: [],
  },

  {
    module: 'inventoryValuationSummary',
    actions: Object.keys(actions.inventoryValuationSummary),
    triggers: [],
  },

  {
    module: 'invoice',
    actions: Object.keys(actions.invoice),
    triggers: [],
  },

  {
    module: 'item',
    actions: Object.keys(actions.item),
    triggers: [],
  },

  {
    module: 'journalEntry',
    actions: Object.keys(actions.journalEntry),
    triggers: [],
  },

  {
    module: 'journalReport',
    actions: Object.keys(actions.journalReport),
    triggers: [],
  },

  {
    module: 'payment',
    actions: Object.keys(actions.payment),
    triggers: [],
  },

  {
    module: 'paymentMethod',
    actions: Object.keys(actions.paymentMethod),
    triggers: [],
  },

  {
    module: 'preferences',
    actions: Object.keys(actions.preferences),
    triggers: [],
  },

  {
    module: 'profitAndLoss',
    actions: Object.keys(actions.profitAndLoss),
    triggers: [],
  },

  {
    module: 'profitAndLossDetail',
    actions: Object.keys(actions.profitAndLossDetail),
    triggers: [],
  },

  {
    module: 'purchase',
    actions: Object.keys(actions.purchase),
    triggers: [],
  },

  {
    module: 'purchaseOrder',
    actions: Object.keys(actions.purchaseOrder),
    triggers: [],
  },

  {
    module: 'recurringTransaction',
    actions: Object.keys(actions.recurringTransaction),
    triggers: [],
  },

  {
    module: 'refundReceipt',
    actions: Object.keys(actions.refundReceipt),
    triggers: [],
  },

  {
    module: 'reimburseCharge',
    actions: Object.keys(actions.reimburseCharge),
    triggers: [],
  },

  {
    module: 'salesByClassSummary',
    actions: Object.keys(actions.salesByClassSummary),
    triggers: [],
  },

  {
    module: 'salesByCustomer',
    actions: Object.keys(actions.salesByCustomer),
    triggers: [],
  },

  {
    module: 'salesByDepartment',
    actions: Object.keys(actions.salesByDepartment),
    triggers: [],
  },

  {
    module: 'salesByProduct',
    actions: Object.keys(actions.salesByProduct),
    triggers: [],
  },

  {
    module: 'salesReceipt',
    actions: Object.keys(actions.salesReceipt),
    triggers: [],
  },

  {
    module: 'taxClassification',
    actions: Object.keys(actions.taxClassification),
    triggers: [],
  },

  {
    module: 'taxCode',
    actions: Object.keys(actions.taxCode),
    triggers: [],
  },

  {
    module: 'taxPayment',
    actions: Object.keys(actions.taxPayment),
    triggers: [],
  },

  {
    module: 'taxRate',
    actions: Object.keys(actions.taxRate),
    triggers: [],
  },

  {
    module: 'taxService',
    actions: Object.keys(actions.taxService),
    triggers: [],
  },

  {
    module: 'taxSummary',
    actions: Object.keys(actions.taxSummary),
    triggers: [],
  },

  {
    module: 'taxAgency',
    actions: Object.keys(actions.taxAgency),
    triggers: [],
  },

  {
    module: 'term',
    actions: Object.keys(actions.term),
    triggers: [],
  },

  {
    module: 'timeActivity',
    actions: Object.keys(actions.timeActivity),
    triggers: [],
  },

  {
    module: 'transactionList',
    actions: Object.keys(actions.transactionList),
    triggers: [],
  },

  {
    module: 'transactionListByVendor',
    actions: Object.keys(actions.transactionListByVendor),
    triggers: [],
  },

  {
    module: 'transactionListByCustomer',
    actions: Object.keys(actions.transactionListByCustomer),
    triggers: [],
  },

  {
    module: 'transactionListWithSplits',
    actions: Object.keys(actions.transactionListWithSplits),
    triggers: [],
  },

  {
    module: 'transfer',
    actions: Object.keys(actions.transfer),
    triggers: [],
  },

  {
    module: 'trialBalance',
    actions: Object.keys(actions.trialBalance),
    triggers: [],
  },

  {
    module: 'vendor',
    actions: Object.keys(actions.vendor),
    triggers: [],
  },

  {
    module: 'vendorBalance',
    actions: Object.keys(actions.vendorBalance),
    triggers: [],
  },

  {
    module: 'vendorBalanceDetail',
    actions: Object.keys(actions.vendorBalanceDetail),
    triggers: [],
  },

  {
    module: 'vendorCredit',
    actions: Object.keys(actions.vendorCredit),
    triggers: [],
  },

  {
    module: 'vendorExpenses',
    actions: Object.keys(actions.vendorExpenses),
    triggers: [],
  },
];

// QuickBooks OAuth URLs
export const landingpage = 'https://appcenter.intuit.com/connect/oauth2';

export const redirect = 'http://localhost:5000/quickbooks/callback';

export interface EntityMeta {
  path: string;
  queryTable: string;
  isMasterData: boolean;
}

export const REPORT_MODULES: Record<string, string> = {
  accountListDetail: 'AccountList',
  apAgingDetail: 'AgedPayableDetail',
  apAgingSummary: 'AgedPayables',
  arAgingDetail: 'AgedReceivableDetail',
  arAgingSummary: 'AgedReceivables',
  balanceSheet: 'BalanceSheet',
  cashFlow: 'CashFlow',
  customerBalance: 'CustomerBalance',
  customerBalanceDetail: 'CustomerBalanceDetail',
  customerIncome: 'CustomerIncome',
  generalLedger: 'GeneralLedger',
  inventoryValuationDetail: 'InventoryValuationDetail',
  inventoryValuationSummary: 'InventoryValuationSummary',
  journalReport: 'JournalReport',
  profitAndLoss: 'ProfitAndLoss',
  profitAndLossDetail: 'ProfitAndLossDetail',
  salesByClassSummary: 'SalesByClassSummary',
  salesByCustomer: 'CustomerSales',
  salesByDepartment: 'DepartmentSales',
  salesByProduct: 'ItemSales',
  taxSummary: 'TaxSummary',
  transactionList: 'TransactionList',
  transactionListByVendor: 'TransactionListByVendor',
  transactionListByCustomer: 'TransactionListByCustomer',
  transactionListWithSplits: 'TransactionListWithSplits',
  trialBalance: 'TrialBalance',
  vendorBalance: 'VendorBalance',
  vendorBalanceDetail: 'VendorBalanceDetail',
  vendorExpenses: 'VendorExpenses',
};

export const ENTITY_CONFIG: Record<string, EntityMeta> = {
  attachable: {
    path: 'attachable',
    queryTable: 'Attachable',
    isMasterData: false,
  },
  bill: { path: 'bill', queryTable: 'Bill', isMasterData: false },
  billPayment: {
    path: 'billpayment',
    queryTable: 'BillPayment',
    isMasterData: false,
  },
  budget: { path: 'budget', queryTable: 'Budget', isMasterData: false },
  changeOrder: {
    path: 'changeorder',
    queryTable: 'ChangeOrder',
    isMasterData: false,
  },
  class: { path: 'class', queryTable: 'Class', isMasterData: true },
  companyCurrency: {
    path: 'companycurrency',
    queryTable: 'CompanyCurrency',
    isMasterData: false,
  },
  creditMemo: {
    path: 'creditmemo',
    queryTable: 'CreditMemo',
    isMasterData: false,
  },
  creditCardPayment: {
    path: 'creditcardpayment',
    queryTable: 'CreditCardPaymentTxn',
    isMasterData: false,
  },
  customer: { path: 'customer', queryTable: 'Customer', isMasterData: true },
  customerType: {
    path: 'customertype',
    queryTable: 'CustomerType',
    isMasterData: true,
  },
  department: {
    path: 'department',
    queryTable: 'Department',
    isMasterData: true,
  },
  deposit: { path: 'deposit', queryTable: 'Deposit', isMasterData: false },
  employee: { path: 'employee', queryTable: 'Employee', isMasterData: true },
  estimate: { path: 'estimate', queryTable: 'Estimate', isMasterData: false },
  exchangeRate: {
    path: 'exchangerate',
    queryTable: 'ExchangeRate',
    isMasterData: false,
  },
  inventoryAdjustment: {
    path: 'inventoryadjustment',
    queryTable: 'InventoryAdjustment',
    isMasterData: false,
  },
  invoice: { path: 'invoice', queryTable: 'Invoice', isMasterData: false },
  item: { path: 'item', queryTable: 'Item', isMasterData: true },
  journalEntry: {
    path: 'journalentry',
    queryTable: 'JournalEntry',
    isMasterData: false,
  },
  payment: { path: 'payment', queryTable: 'Payment', isMasterData: false },
  paymentMethod: {
    path: 'paymentmethod',
    queryTable: 'PaymentMethod',
    isMasterData: true,
  },
  purchase: { path: 'purchase', queryTable: 'Purchase', isMasterData: false },
  purchaseOrder: {
    path: 'purchaseorder',
    queryTable: 'PurchaseOrder',
    isMasterData: false,
  },
  recurringTransaction: {
    path: 'recurringtransaction',
    queryTable: 'RecurringTransaction',
    isMasterData: false,
  },
  refundReceipt: {
    path: 'refundreceipt',
    queryTable: 'RefundReceipt',
    isMasterData: false,
  },
  reimburseCharge: {
    path: 'reimbursecharge',
    queryTable: 'ReimburseCharge',
    isMasterData: false,
  },
  salesReceipt: {
    path: 'salesreceipt',
    queryTable: 'SalesReceipt',
    isMasterData: false,
  },
  taxCode: { path: 'taxcode', queryTable: 'TaxCode', isMasterData: true },
  taxPayment: {
    path: 'taxpayment',
    queryTable: 'TaxPayment',
    isMasterData: false,
  },
  taxRate: { path: 'taxrate', queryTable: 'TaxRate', isMasterData: true },
  taxAgency: { path: 'taxagency', queryTable: 'TaxAgency', isMasterData: true },
  term: { path: 'term', queryTable: 'Term', isMasterData: true },
  timeActivity: {
    path: 'timeactivity',
    queryTable: 'TimeActivity',
    isMasterData: false,
  },
  transfer: { path: 'transfer', queryTable: 'Transfer', isMasterData: false },
  vendor: { path: 'vendor', queryTable: 'Vendor', isMasterData: true },
  vendorCredit: {
    path: 'vendorcredit',
    queryTable: 'VendorCredit',
    isMasterData: false,
  },
};

export default {
  XappName,
  modules,
  landingpage,
  redirect,
  REPORT_MODULES,
  ENTITY_CONFIG,
};
