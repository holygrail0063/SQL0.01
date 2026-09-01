import type { CourseDefinition, LessonDefinition, LessonStageDefinition } from "@/lib/course";

export type SqlConceptTeachingKind = "full" | "mini";
export type SqlConceptVisualKind =
  | "select-all"
  | "select-columns"
  | "filter"
  | "and-filter"
  | "number-line"
  | "or-filter"
  | "collapse-sql"
  | "like"
  | "nulls"
  | "sort"
  | "top"
  | "distinct"
  | "alias"
  | "aggregate"
  | "min-max"
  | "group"
  | "having"
  | "join"
  | "join-chain"
  | "left-join"
  | "unmatched"
  | "case"
  | "timeline"
  | "date-overlap"
  | "conditional-aggregation"
  | "kpi";

export type SqlConceptLesson = {
  id: string;
  triggerSkills: string[];
  reviewSkills?: string[];
  firstChallengeId: number;
  kind: SqlConceptTeachingKind;
  title: string;
  shortTitle: string;
  summary: string;
  syntax: string;
  plainEnglish: string[];
  exampleTitle: string;
  exampleSql: string;
  yourTurn: string;
  reinforcement: string;
  coachPrompt: string;
  visual: SqlConceptVisualKind;
};

export const sqlConceptLessons: SqlConceptLesson[] = [
  full("select-from", ["select", "from"], 1, "SELECT * and FROM", "SELECT * / FROM", "SQL starts by saying what to show and which table to read.", "SELECT *\nFROM TableName;", ["SELECT names the output you want.", "* means every available column.", "FROM names the table that provides the rows."], "Employee directory", "SELECT *\nFROM Employees;", "Now use the SQLBank Customers table for the current request.", "SELECT and FROM tell SQL what to show and where to get it.", "Start with the table named in the request, then decide whether the question wants every column or a smaller list.", "select-all"),
  full("column-selection", ["column-selection", "select-columns"], 2, "Selecting Specific Columns", "Column selection", "Most business reports need only a few columns, not the entire table.", "SELECT ColumnA, ColumnB\nFROM TableName;", ["Columns listed after SELECT become the result columns.", "Columns not listed stay hidden.", "Use commas between column names."], "Employee location list", "SELECT FirstName, Province\nFROM Employees;", "Pick only the columns requested by this SQLBank question.", "Column selection keeps the result focused on the requested fields.", "The question names the columns the stakeholder needs. Put those columns after SELECT and read from the requested table.", "select-columns"),
  full("where", ["where"], 3, "Filtering Rows with WHERE", "WHERE", "WHERE keeps only rows that match a condition.", "SELECT *\nFROM TableName\nWHERE ColumnName = 'Text';", ["WHERE starts a row filter.", "The column on the left is checked for each row.", "Text values use single quotes."], "Employee province filter", "SELECT *\nFROM Employees\nWHERE Province = 'Ontario';", "Filter the SQLBank rows to the value requested in the question.", "WHERE filtered rows before the result was returned.", "Look for the phrase that limits which rows should appear. That phrase usually becomes the WHERE condition.", "filter"),
  full("and", ["and"], 4, "Combining Filters with AND", "AND", "AND keeps a row only when every condition is true.", "WHERE Province = 'Ontario'\n  AND Status = 'Active'", ["The first condition narrows the rows.", "AND applies another condition to the remaining rows.", "Both conditions must be true for a row to stay."], "Active Ontario employees", "SELECT FirstName, Province, Status\nFROM Employees\nWHERE Province = 'Ontario'\n  AND Status = 'Active';", "Use both requested conditions in the SQLBank filter.", "AND required both conditions to be true.", "When the request says one condition and another condition, both belong in the WHERE clause with AND.", "and-filter"),
  mini("order-by", ["order-by"], 4, "ORDER BY Introduction", "ORDER BY", "ORDER BY controls the sequence of rows in the output.", "ORDER BY CustomerID", ["Rows can be rearranged by a column.", "Without ORDER BY, row order is not guaranteed."], "Employee ID order", "SELECT EmployeeID, FirstName\nFROM Employees\nORDER BY EmployeeID;", "Add the ordering phrase only when the question asks for a specific order.", "ORDER BY controlled the output order.", "If the request asks for a sorted result, add ORDER BY after filtering.", "sort"),
  full("numeric-comparison", ["numeric-comparison"], 9, "Comparing Numbers", "Comparisons", "Numeric filters compare a column to a number.", "WHERE Balance >= 5000", ["> means greater than.", ">= means at least.", "Numbers usually do not need quotes."], "Large account balances", "SELECT AccountID, Balance\nFROM Accounts\nWHERE Balance >= 5000;", "Translate the business phrase into the matching comparison operator.", "The comparison operator kept rows in the requested numeric range.", "Phrases like at least, more than, below, and no more than point to numeric comparison operators.", "number-line"),
  full("or", ["or"], 13, "Either Condition with OR", "OR", "OR keeps a row when any listed condition is true.", "WHERE Province = 'Ontario'\n   OR Province = 'Alberta'", ["Each condition is checked separately.", "A row stays if either condition matches.", "OR is useful for a short list of alternatives."], "Two-region employees", "SELECT FirstName, Province\nFROM Employees\nWHERE Province = 'Ontario'\n   OR Province = 'Alberta';", "Keep rows matching either requested value.", "OR accepted rows from more than one condition.", "When the request says this or that, use OR unless a compact IN list fits better.", "or-filter"),
  full("in", ["in"], 14, "Lists of Values with IN", "IN", "IN is a cleaner way to check whether a value is in a list.", "WHERE Province IN ('Ontario', 'Alberta', 'Manitoba')", ["IN replaces repeated OR checks on the same column.", "Put the allowed values inside parentheses.", "Text values still use single quotes."], "Three-region employees", "SELECT FirstName, Province\nFROM Employees\nWHERE Province IN ('Ontario', 'Alberta', 'Manitoba');", "Use IN for the list of allowed values in the SQLBank request.", "IN matched one column against a list of values.", "If one column can match several accepted values, IN is usually simpler than repeating OR.", "collapse-sql"),
  full("between", ["between"], 15, "Ranges with BETWEEN", "BETWEEN", "BETWEEN keeps values inside an inclusive range.", "WHERE Amount BETWEEN 10000 AND 20000", ["The lower boundary is included.", "The upper boundary is included.", "BETWEEN works well for simple numeric ranges."], "Mid-size invoices", "SELECT InvoiceID, Amount\nFROM Invoices\nWHERE Amount BETWEEN 10000 AND 20000;", "Use the two boundaries from the SQLBank request.", "BETWEEN kept values inside the requested inclusive range.", "When a request says between two numbers, BETWEEN can express the lower and upper boundary directly.", "number-line"),
  full("like", ["like"], 16, "Matching Text Patterns with LIKE", "LIKE", "LIKE compares text to a pattern instead of one exact value.", "WHERE FirstName LIKE 'A%'", ["A is the starting text.", "% means anything may follow.", "Pattern text uses single quotes."], "Names starting with A", "SELECT FirstName\nFROM Employees\nWHERE FirstName LIKE 'A%';", "Use the wildcard pattern that matches the wording of the SQLBank request.", "LIKE matched text using a pattern.", "Look for words like starts with, contains, or ends with. Those usually need LIKE and a percent wildcard.", "like"),
  mini("like-prefix", ["like"], 17, "Another LIKE Pattern", "LIKE pattern", "A percent sign can move depending on the pattern you need.", "LIKE 'A%'", ["'A%' means starts with A.", "'%A%' means contains A.", "'%A' means ends with A."], "Name prefix", "SELECT FirstName\nFROM Employees\nWHERE FirstName LIKE 'A%';", "Choose the wildcard placement that matches the wording.", "The wildcard pattern matched the requested text shape.", "Read the text-pattern phrase carefully before placing the percent sign.", "like"),
  full("is-null", ["is-null"], 18, "Finding Missing Values with IS NULL", "IS NULL", "NULL means missing or unknown, not zero and not empty text.", "WHERE ClosedDate IS NULL", ["Use IS NULL instead of = NULL.", "NULL marks missing information.", "Rows with real values are filtered out."], "Employees without an end date", "SELECT EmployeeID, EndDate\nFROM Employees\nWHERE EndDate IS NULL;", "Find rows where the requested value is missing.", "IS NULL kept rows where the value was missing.", "When the request asks for missing, no date, or not yet closed, check whether the relevant column IS NULL.", "nulls"),
  mini("not-equal", ["not-equal"], 19, "Not Equal with <>", "Not equal", "<> keeps rows where a value is different from the one named.", "WHERE Status <> 'Closed'", ["<> means not equal to.", "It is the opposite of =."], "Open employee cases", "SELECT CaseID, Status\nFROM Cases\nWHERE Status <> 'Closed';", "Use <> when the question excludes one value.", "<> removed rows equal to the excluded value.", "If the request says not, except, or excluding, look for a not-equal condition.", "filter"),
  full("order-by-desc", ["order-by-desc"], 20, "Sorting Highest to Lowest", "ORDER BY DESC", "DESC sorts values from largest to smallest or latest to earliest.", "ORDER BY LoanAmount DESC", ["ORDER BY chooses the sort column.", "DESC reverses the normal order.", "Highest values rise to the top."], "Largest invoices first", "SELECT InvoiceID, Amount\nFROM Invoices\nORDER BY Amount DESC;", "Sort the SQLBank result in the direction requested.", "DESC sorted the largest values first.", "Words like largest, highest, newest, or most recent often mean ORDER BY with DESC.", "sort"),
  full("top", ["top"], 21, "Keeping the Top Rows", "TOP", "TOP limits the number of rows returned.", "SELECT TOP 10 ColumnA\nFROM TableName\nORDER BY Metric DESC;", ["Sort first so top has meaning.", "TOP keeps only the first N rows after sorting.", "The number follows TOP."], "Top invoices", "SELECT TOP 10 InvoiceID, Amount\nFROM Invoices\nORDER BY Amount DESC;", "Return only the number of rows requested.", "TOP limited the result after sorting.", "When a request asks for top 5 or 10 largest, combine TOP with ORDER BY.", "top"),
  mini("order-by-asc", ["order-by-asc"], 23, "Ascending Sorts", "ASC", "ASC sorts smallest, earliest, or alphabetical values first.", "ORDER BY RiskScore ASC", ["ASC is the default direction.", "DESC is the reverse direction."], "Lowest scores first", "SELECT CaseID, Score\nFROM Cases\nORDER BY Score ASC;", "Use ASC when the question asks for lowest or earliest first.", "ASC sorted the smallest values first.", "Lowest, smallest, oldest, and alphabetical usually point to ASC.", "sort"),
  full("distinct", ["distinct"], 24, "Unique Values with DISTINCT", "DISTINCT", "DISTINCT removes duplicate result rows.", "SELECT DISTINCT Province\nFROM Customers;", ["Repeated values collapse into one value.", "DISTINCT applies to the selected columns.", "It is useful for lists of categories."], "Unique employee provinces", "SELECT DISTINCT Province\nFROM Employees;", "Return each requested value once.", "DISTINCT collapsed duplicates into unique output rows.", "If the request asks for unique values or a list of categories, consider DISTINCT.", "distinct"),
  full("aliases", ["aliases"], 26, "Readable Names with AS", "AS aliases", "AS changes the output label without renaming the database column.", "CustomerID AS CustomerNumber", ["The original column is still CustomerID.", "The result column label becomes CustomerNumber.", "Aliases make reports easier to read."], "Employee number label", "SELECT EmployeeID AS EmployeeNumber\nFROM Employees;", "Use the output names requested by the SQLBank prompt.", "AS gave the result column a readable label.", "When a request says named as or asks for a specific output label, use AS for the alias.", "alias"),
  mini("multi-column-order-by", ["multi-column-order-by"], 27, "Tie-Breaker Sorting", "Multi-column sort", "A second ORDER BY column breaks ties from the first sort.", "ORDER BY ApplicationDate DESC, ApplicationID DESC", ["SQL sorts by the first column first.", "Rows tied on that value are sorted by the next column."], "Newest cases first", "SELECT CaseID, CreatedDate\nFROM Cases\nORDER BY CreatedDate DESC, CaseID DESC;", "Sort by the main date, then the tie-breaker.", "The second sort column broke ties from the first sort.", "When two ORDER BY columns appear, read them from left to right: primary sort, then tie-breaker.", "sort"),
  full("count", ["count"], 28, "Counting Rows", "COUNT", "COUNT turns many matching rows into one number.", "COUNT(*)", ["COUNT(*) counts rows.", "It returns a metric, not the original rows.", "Use an alias for a readable metric name."], "Customer count", "SELECT COUNT(*) AS EmployeeCount\nFROM Employees;", "Count the SQLBank rows requested by the question.", "COUNT collapsed matching rows into a single total.", "If the request asks how many, COUNT is usually the aggregate you need.", "aggregate"),
  full("sum", ["sum"], 30, "Adding Values with SUM", "SUM", "SUM adds numeric values into a total.", "SUM(Amount)", ["SUM works on a numeric column.", "The output is one total unless grouped.", "Aliases name the metric clearly."], "Invoice total", "SELECT SUM(Amount) AS TotalAmount\nFROM Invoices;", "Add the numeric column requested by the question.", "SUM combined many values into one total.", "If the request asks for total value or total amount, SUM is usually involved.", "aggregate"),
  full("avg", ["avg"], 31, "Averages with AVG", "AVG", "AVG calculates total divided by the number of values.", "AVG(InterestRate)", ["AVG works on a numeric column.", "It summarizes many values into one typical value.", "Use an alias for the result label."], "Average invoice amount", "SELECT AVG(Amount) AS AverageAmount\nFROM Invoices;", "Calculate the average requested by the SQLBank prompt.", "AVG summarized values into an average.", "If the request asks for average or typical value, AVG is the aggregate to reach for.", "aggregate"),
  mini("min-max", ["min", "max"], 32, "Lowest and Highest Values", "MIN / MAX", "MIN finds the lowest value; MAX finds the highest value.", "MIN(Amount), MAX(Amount)", ["MIN highlights the smallest value.", "MAX highlights the largest value."], "Invoice range", "SELECT MIN(Amount) AS MinAmount, MAX(Amount) AS MaxAmount\nFROM Invoices;", "Return the requested low and high values.", "MIN and MAX found the range of values.", "Smallest, earliest, lowest, largest, latest, and highest often point to MIN or MAX.", "min-max"),
  full("group-by", ["group-by"], 36, "Grouping Rows with GROUP BY", "GROUP BY", "GROUP BY creates one result group for each unique category.", "SELECT Province, COUNT(*)\nFROM Customers\nGROUP BY Province;", ["Rows are first separated by category.", "An aggregate is calculated inside each group.", "Business phrases like for each, by, and per often signal GROUP BY."], "Employees by province", "SELECT Province, COUNT(*) AS EmployeeCount\nFROM Employees\nGROUP BY Province;", "Find the category in the SQLBank request and group by it.", "GROUP BY created one result row per category.", "The phrase for each province points to grouping by Province before calculating the count.", "group"),
  full("having", ["having"], 42, "Filtering Groups with HAVING", "HAVING", "HAVING filters grouped results after aggregation.", "GROUP BY Province\nHAVING COUNT(*) > 50", ["WHERE filters individual rows before grouping.", "GROUP BY creates the groups.", "HAVING removes groups that do not meet the aggregate condition."], "Large employee provinces", "SELECT Province, COUNT(*) AS EmployeeCount\nFROM Employees\nGROUP BY Province\nHAVING COUNT(*) > 50;", "Filter groups using the aggregate threshold in the SQLBank request.", "HAVING filtered groups after COUNT was calculated.", "If the condition refers to a group metric, use HAVING after GROUP BY.", "having"),
  full("inner-join", ["inner-join"], 43, "Connecting Tables with INNER JOIN", "INNER JOIN", "INNER JOIN combines matching rows from related tables.", "FROM Orders AS o\nINNER JOIN Customers AS c\n    ON o.CustomerID = c.CustomerID", ["JOIN combines data from another table.", "ON describes how rows match.", "Matching key values connect the records."], "Orders with customer names", "SELECT o.OrderID, c.Name, o.Amount\nFROM Orders AS o\nINNER JOIN Customers AS c\n    ON o.CustomerID = c.CustomerID;", "Connect the SQLBank tables through the shared key.", "INNER JOIN connected rows with matching keys.", "Look for one table holding IDs and another table holding readable names. JOIN connects them.", "join"),
  full("three-table-inner-join", ["three-table-inner-join"], 53, "Joining a Chain of Tables", "Three-table JOIN", "Multiple JOINs can follow a relationship chain across tables.", "FROM Payments AS p\nINNER JOIN Loans AS l ON p.LoanID = l.LoanID\nINNER JOIN Customers AS c ON l.CustomerID = c.CustomerID", ["Start from the table at the grain of the request.", "Join the next table using its shared key.", "Repeat for the next relationship in the chain."], "Payments with customer names", "SELECT p.PaymentID, c.Name, p.Amount\nFROM Payments AS p\nINNER JOIN Orders AS o ON p.OrderID = o.OrderID\nINNER JOIN Customers AS c ON o.CustomerID = c.CustomerID;", "Follow the SQLBank relationship chain one join at a time.", "The query connected a chain of related tables.", "When the output needs details spread across three tables, map the relationships before writing SELECT.", "join-chain"),
  full("left-join", ["left-join"], 58, "Keeping Unmatched Rows with LEFT JOIN", "LEFT JOIN", "LEFT JOIN keeps every row from the left table even when no match exists.", "FROM Customers AS c\nLEFT JOIN Loans AS l\n    ON c.CustomerID = l.CustomerID", ["INNER JOIN keeps only matches.", "LEFT JOIN keeps the left-side rows.", "Missing right-side values appear as NULL."], "Employees with optional equipment", "SELECT e.Name, eq.AssetTag\nFROM Employees AS e\nLEFT JOIN Equipment AS eq\n    ON e.EmployeeID = eq.EmployeeID;", "Choose LEFT JOIN when the request says to include rows without matches.", "LEFT JOIN preserved rows without matching records.", "If the request says include all records from one table, even missing matches, reach for LEFT JOIN.", "left-join"),
  full("unmatched-left-join", ["left-join", "is-null"], 65, "Finding Rows without Matches", "Unmatched rows", "LEFT JOIN plus IS NULL finds records with no related match.", "LEFT JOIN ...\nWHERE joined_table.ID IS NULL", ["LEFT JOIN preserves unmatched left rows.", "The joined table columns become NULL when no match exists.", "IS NULL keeps only those unmatched rows."], "Employees without equipment", "SELECT e.EmployeeID, e.Name\nFROM Employees AS e\nLEFT JOIN Equipment AS eq\n    ON e.EmployeeID = eq.EmployeeID\nWHERE eq.AssetTag IS NULL;", "Keep only the SQLBank rows that have no matching related record.", "LEFT JOIN plus IS NULL found rows without matches.", "For business requests like without loans or no matching record, combine LEFT JOIN with an IS NULL check on the joined table.", "unmatched"),
  full("case", ["case"], 66, "Business Labels with CASE", "CASE", "CASE creates labels or calculated values based on conditions.", "CASE\n    WHEN Amount < 10000 THEN 'Small'\n    WHEN Amount < 25000 THEN 'Medium'\n    ELSE 'Large'\nEND", ["WHEN checks a condition.", "THEN returns the label for matching rows.", "ELSE handles everything that did not match earlier."], "Invoice size bands", "SELECT InvoiceID,\n       CASE\n           WHEN Amount < 10000 THEN 'Small'\n           WHEN Amount < 25000 THEN 'Medium'\n           ELSE 'Large'\n       END AS AmountBand\nFROM Invoices;", "Translate the SQLBank business bands into CASE branches.", "CASE converted raw values into business labels.", "When the prompt defines labels from rules, write those rules as CASE branches.", "case"),
  full("date-range", ["date-range"], 72, "Date Ranges", "Date range", "Date ranges capture records inside a reporting period.", "WHERE DateColumn >= '2025-01-01'\n  AND DateColumn < '2026-01-01'", ["The first condition includes the start date.", "The second condition stops before the next period.", "This pattern captures the full year."], "Orders created in 2025", "SELECT OrderID, CreatedDate\nFROM Orders\nWHERE CreatedDate >= '2025-01-01'\n  AND CreatedDate < '2026-01-01';", "Use the reporting period requested by the SQLBank prompt.", "The date range kept rows inside the requested period.", "For a full year, use the start of the year and stop before the next year begins.", "timeline"),
  mini("date-overlap-logic", ["date-overlap-logic"], 77, "Active on a Date", "Date overlap", "A target date is inside a period when it is after the start and before the end.", "StartDate <= '2025-06-15'\nAND EndDate >= '2025-06-15'", ["The target date must be on or after the start.", "It must also be on or before the end."], "Campaign active date", "SELECT CampaignID\nFROM Campaigns\nWHERE StartDate <= '2025-06-15'\n  AND EndDate >= '2025-06-15';", "Check that the requested date sits inside the SQLBank date window.", "The two date checks proved the record was active on the target date.", "For active-on-date logic, the target date needs to fall between the start and end columns.", "date-overlap"),
  full("conditional-aggregation", ["conditional-aggregation"], 78, "Conditional Aggregation", "Conditional aggregation", "Conditional aggregation calculates a metric for only part of each group.", "SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END)", ["CASE turns matching rows into 1 and non-matching rows into 0.", "SUM adds those 1s and 0s.", "Inside GROUP BY, this creates one conditional metric per group."], "Active employees by province", "SELECT Province,\n       COUNT(*) AS EmployeeCount,\n       SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) AS ActiveEmployeeCount\nFROM Employees\nGROUP BY Province;", "Build the conditional count requested by the SQLBank report.", "Conditional aggregation counted only the rows matching the condition.", "When one report needs total count and matching count side by side, use SUM around a CASE expression.", "conditional-aggregation"),
  full("kpi-approval-rate", ["arithmetic", "conditional-aggregation"], 89, "Calculating Approval Rate", "KPI calculation", "A KPI often combines counts into a business metric.", "100.0 * SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*)", ["COUNT(*) gives total applications.", "Conditional aggregation counts approved applications.", "Dividing approved by total gives the rate; multiplying by 100 makes it a percentage."], "Approval rate by team", "SELECT Team,\n       COUNT(*) AS ApplicationCount,\n       SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) AS ApprovedCount,\n       100.0 * SUM(CASE WHEN Status = 'Approved' THEN 1 ELSE 0 END) / COUNT(*) AS ApprovalRatePct\nFROM Applications\nGROUP BY Team;", "Calculate the requested SQLBank approval-rate metric from the grouped counts.", "The KPI combined approved count and total count into a percentage.", "Approval rate is approved applications divided by all applications in the same group.", "kpi"),
];

export function conceptLessonById(id: string) {
  return sqlConceptLessons.find((lesson) => lesson.id === id) ?? null;
}

export function conceptStagesForLesson(course: CourseDefinition, lesson: LessonDefinition): LessonStageDefinition[] {
  if (course.learningModeId !== "completely-new" || lesson.challengeId >= 91) return [];
  return sqlConceptLessons
    .filter((concept) => concept.firstChallengeId === lesson.challengeId && conceptMatchesLesson(concept, lesson))
    .map((concept, index) => conceptStage(concept, lesson, index + 1));
}

export function teachingConceptForLesson(course: CourseDefinition, lesson: LessonDefinition) {
  if (course.learningModeId !== "completely-new" || lesson.challengeId >= 91) return null;
  return sqlConceptLessons.find((concept) => concept.firstChallengeId === lesson.challengeId && conceptMatchesLesson(concept, lesson)) ?? sqlConceptLessons.find((concept) => concept.firstChallengeId <= lesson.challengeId && conceptMayHelpLesson(concept, lesson)) ?? null;
}
export function reviewableConceptLessons(course: CourseDefinition, lesson: LessonDefinition, learnedConceptIds: Set<string>) {
  if (course.learningModeId !== "completely-new") return [];
  return sqlConceptLessons.filter((concept) => learnedConceptIds.has(concept.id) && conceptMayHelpLesson(concept, lesson));
}

export function reinforcementForLesson(course: CourseDefinition, lesson: LessonDefinition, learnedConceptIds: Set<string>) {
  if (course.learningModeId !== "completely-new") return null;
  const direct = sqlConceptLessons.find((concept) => learnedConceptIds.has(concept.id) && conceptMayHelpLesson(concept, lesson));
  return direct?.reinforcement ?? null;
}

function full(id: string, triggerSkills: string[], firstChallengeId: number, title: string, shortTitle: string, summary: string, syntax: string, plainEnglish: string[], exampleTitle: string, exampleSql: string, yourTurn: string, reinforcement: string, coachPrompt: string, visual: SqlConceptVisualKind): SqlConceptLesson {
  return { id, triggerSkills, firstChallengeId, kind: "full", title, shortTitle, summary, syntax, plainEnglish, exampleTitle, exampleSql, yourTurn, reinforcement, coachPrompt, visual };
}

function mini(id: string, triggerSkills: string[], firstChallengeId: number, title: string, shortTitle: string, summary: string, syntax: string, plainEnglish: string[], exampleTitle: string, exampleSql: string, yourTurn: string, reinforcement: string, coachPrompt: string, visual: SqlConceptVisualKind): SqlConceptLesson {
  return { id, triggerSkills, firstChallengeId, kind: "mini", title, shortTitle, summary, syntax, plainEnglish, exampleTitle, exampleSql, yourTurn, reinforcement, coachPrompt, visual };
}

function conceptStage(concept: SqlConceptLesson, lesson: LessonDefinition, sequence: number): LessonStageDefinition {
  return {
    id: `${lesson.id}-concept-${concept.id}`,
    lessonId: lesson.id,
    sequence,
    type: "review",
    title: concept.title,
    instructions: concept.summary,
    estimatedMinutes: concept.kind === "full" ? 1 : 0,
    hints: [],
    questionType: "guided",
    databaseId: "sqlbank",
    difficultyId: lesson.difficultyId,
    conceptId: concept.id,
    sourceChallengeId: lesson.challengeId,
    teachingKind: concept.kind,
    reinforcement: concept.reinforcement,
  };
}

function conceptMatchesLesson(concept: SqlConceptLesson, lesson: LessonDefinition) {
  return concept.triggerSkills.every((skill) => lesson.skills.includes(skill));
}

function conceptMayHelpLesson(concept: SqlConceptLesson, lesson: LessonDefinition) {
  const skills = new Set([...concept.triggerSkills, ...(concept.reviewSkills ?? [])]);
  if (concept.id === "inner-join" && lesson.skills.includes("join")) return true;
  if (concept.id === "aliases" && lesson.skills.includes("alias")) return true;
  return lesson.skills.some((skill) => skills.has(skill));
}
