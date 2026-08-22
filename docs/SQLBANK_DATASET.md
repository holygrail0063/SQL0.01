# SQLBank Dataset

Dataset version: `SQLBankTraining` seeded in `frontend/lib/sqlbank-server.ts`.

SQLBank is a fictional Canadian banking environment for QueryRight lessons. The schema explorer, in-memory execution, `SELECT *` expansion, curriculum validation, and developer docs should stay aligned with the schema metadata in `sqlbank-server.ts`.

## Tables And Grain

## Customers

One row per customer.

Columns: `CustomerID`, `FirstName`, `LastName`, `Province`, `City`, `DateOfBirth`, `CustomerSince`, `CustomerStatus`, `CustomerSegment`, `AcquisitionChannel`.

Used for SELECT, projection, filtering, customer directory, segmentation, and onboarding lessons.

## Branches

One row per branch or service hub.

Columns: `BranchID`, `BranchName`, `Province`, `City`.

Used for joins, branch reporting, regional rollups, target comparisons, and approval-rate assignments.

## Applications

One row per lending or credit application.

Columns: `ApplicationID`, `CustomerID`, `BranchID`, `ProductID`, `ApplicationDate`, `RequestedAmount`, `Status`, `RiskScore`.

Used for application counts, status funnels, approval rates, monthly scorecards, and targets.

## Loans

One row per approved/generated loan.

Columns: `LoanID`, `CustomerID`, `BranchID`, `LoanAmount`, `InterestRate`, `StartDate`, `LoanStatus`.

Used for sorting, top-N, loan exposure, CASE bands, and branch-level lending totals.

## Payments

One row per payment transaction against a loan.

Columns: `PaymentID`, `LoanID`, `PaymentDate`, `Amount`, `PaymentStatus`.

Used for payment-status and loan-servicing scenarios.

## Products

One row per product in the SQLBank catalog.

Columns: `ProductID`, `ProductName`, `ProductCategory`, `InterestRate`, `LaunchDate`, `ProductStatus`.

Used for product adoption and account/product joins.

## Accounts

One row per customer account.

Columns: `AccountID`, `CustomerID`, `ProductID`, `AccountType`, `OpenedDate`, `ClosedDate`, `Balance`, `AccountStatus`.

Used for active account analysis, customer-account grain lessons, balances, and NULL handling through `ClosedDate`.

## Transactions

One row per account transaction.

Columns: `TransactionID`, `AccountID`, `TransactionDate`, `TransactionType`, `Amount`, `MerchantCategory`, `Channel`, `TransactionStatus`.

Used for high-value transaction review, monthly trends, engagement analysis, and active-customer metrics.

## Campaigns

One row per marketing campaign.

Columns: `CampaignID`, `CampaignName`, `CampaignType`, `StartDate`, `EndDate`, `Channel`, `CampaignCost`.

Reserved for acquisition and campaign-analysis expansion.

## CustomerEvents

One row per customer funnel/event action.

Columns: `EventID`, `CustomerID`, `SessionID`, `EventName`, `EventTimestamp`, `ProductID`, `Channel`, `DeviceType`.

Used for funnel analysis with distinct customer counts.

## MonthlyTargets

One row per branch and month target.

Columns: `Month`, `BranchID`, `ApplicationsTarget`, `ApprovalsTarget`, `RevenueTarget`, `CustomerGrowthTarget`.

Used for actuals-to-targets and branch-month grain lessons.

## Seeded Patterns

- Ontario has enough customers for beginner filtering tasks.
- Loan amounts vary enough for sorting and top-N exercises.
- Applications include `Approved`, `Declined`, and `Pending` statuses for KPI calculations.
- Accounts include NULL `ClosedDate` values for open accounts.
- Transactions include successful and failed rows for filtering and trend analysis.
- Customer events include staged funnel events for conversion-rate tasks.

When new lessons rely on a data pattern, document the pattern here and add a curriculum validation/regression case when practical.
