export const MOCK_TESTS = [
    {
        id: "test-1",
        title: "BBE Entrance Simulation 2025",
        questionsCount: 10,
        timeLimit: "45 min",
        category: "Full Mock"
    },
    {
        id: "test-2",
        title: "Mathematics & Financial Logic",
        questionsCount: 15,
        timeLimit: "30 min",
        category: "Math"
    }
];

export const MOCK_RESULTS = [
    {
        id: "res-1",
        testTitle: "BBE Entrance Simulation 2025",
        userName: "Alex Doe",
        score: 85,
        date: "2024-05-20",
        status: "Passed"
    },
    {
        id: "res-2",
        testTitle: "BBE Entrance Simulation 2025",
        userName: "Sarah Smith",
        score: 92,
        date: "2024-05-21",
        status: "Passed"
    }
];

export const BBE_MOCK_TEST = [
    {
        id: 1,
        topic: "Microeconomics: Market Dynamics",
        questionText: "Which of the following statements regarding market equilibrium and price controls are correct?",
        statements: [
            { id: "1a", text: "A price floor set below the equilibrium price has no effect on the market.", isCorrect: true },
            { id: "1b", text: "Binding price ceilings always lead to a surplus of the good.", isCorrect: false },
            { id: "1c", text: "Producer surplus decreases when a binding price ceiling is implemented.", isCorrect: true },
            { id: "1d", text: "An increase in demand, ceteris paribus, leads to a higher equilibrium price and quantity.", isCorrect: true },
            { id: "1e", text: "Deadweight loss represents the loss in total surplus due to market inefficiency.", isCorrect: true }
        ]
    },
    {
        id: 2,
        topic: "Mathematics: Financial Math",
        questionText: "An investment of $1,000 is made at a nominal annual interest rate of 6%. Consider the following:",
        statements: [
            { id: "2a", text: "With annual compounding, the value after 2 years is $1,123.60.", isCorrect: true },
            { id: "2b", text: "Continuous compounding yields a lower future value than annual compounding.", isCorrect: false },
            { id: "2c", text: "The effective annual rate is higher if interest is compounded monthly rather than annually.", isCorrect: true },
            { id: "2d", text: "If the inflation rate is 2%, the real interest rate is approximately 4%.", isCorrect: true },
            { id: "2e", text: "The present value of $1,000 received in one year is higher if the discount rate decreases.", isCorrect: true }
        ]
    },
    {
        id: 3,
        topic: "Macroeconomics: National Accounting",
        questionText: "Regarding the calculation and components of Gross Domestic Product (GDP):",
        statements: [
            { id: "3a", text: "GDP includes the value of intermediate goods to avoid double counting.", isCorrect: false },
            { id: "3b", text: "Transfer payments (like social security) are included in the 'Government Spending' component of GDP.", isCorrect: false },
            { id: "3c", text: "Real GDP is adjusted for changes in the price level using a GDP deflator.", isCorrect: true },
            { id: "3d", text: "The expenditure approach sums consumption, investment, government spending, and net exports.", isCorrect: true },
            { id: "3e", text: "GDP per capita is a perfect measure of the standard of living and income equality.", isCorrect: false }
        ]
    },
    {
        id: 4,
        topic: "Mathematics: Calculus",
        questionText: "Consider the function $f(x) = -2x^2 + 8x - 5$. Which statements are true?",
        statements: [
            { id: "4a", text: "The graph of the function is a parabola opening upwards.", isCorrect: false },
            { id: "4b", text: "The first derivative $f'(x)$ is $-4x + 8$.", isCorrect: true },
            { id: "4c", text: "The function reaches its maximum value at $x = 2$.", isCorrect: true },
            { id: "4d", text: "The y-intercept of the function is located at $(0, -5)$.", isCorrect: true },
            { id: "4e", text: "The function is strictly increasing on the interval $(-\infty, 2)$.", isCorrect: true }
        ]
    },
    {
        id: 5,
        topic: "Business: Accounting Basics",
        questionText: "Regarding the balance sheet and the accounting equation:",
        statements: [
            { id: "5a", text: "Assets = Liabilities + Owner's Equity.", isCorrect: true },
            { id: "5b", text: "Inventory is classified as a non-current asset.", isCorrect: false },
            { id: "5c", text: "Accounts Payable is a liability representing money owed by customers to the firm.", isCorrect: false },
            { id: "5d", text: "Retained earnings are a component of Owner's Equity.", isCorrect: true },
            { id: "5e", text: "A decrease in a liability, with assets constant, must result in an increase in equity.", isCorrect: true }
        ]
    },
    {
        id: 6,
        topic: "English: Business Context",
        questionText: "Identify if the following sentences are grammatically correct and appropriate for formal business writing:",
        statements: [
            { id: "6a", text: "The company has decided to 'lay off' several employees due to the recession.", isCorrect: true },
            { id: "6b", text: "If the manager would have known about the error, he would have fixed it.", isCorrect: false },
            { id: "6c", text: "Despite of the high costs, the project was approved.", isCorrect: false },
            { id: "6d", text: "The merger will take place on the first of July.", isCorrect: true },
            { id: "6e", text: "Our results are superior than our competitors' results.", isCorrect: false }
        ]
    },
    {
        id: 7,
        topic: "Microeconomics: Elasticity",
        questionText: "Regarding the concept of price elasticity of demand (PED):",
        statements: [
            { id: "7a", text: "If $|PED| > 1$, demand is said to be elastic.", isCorrect: true },
            { id: "7b", text: "For a perfectly inelastic good, the demand curve is horizontal.", isCorrect: false },
            { id: "7c", text: "Goods with many close substitutes tend to have more elastic demand.", isCorrect: true },
            { id: "7d", text: "If demand is elastic, a price increase will lead to an increase in total revenue.", isCorrect: false },
            { id: "7e", text: "The cross-price elasticity of demand for complements is negative.", isCorrect: true }
        ]
    },
    {
        id: 8,
        topic: "Mathematics: Probability",
        questionText: "Consider a deck of 52 standard playing cards. Which statements are correct?",
        statements: [
            { id: "8a", text: "The probability of drawing a Red King is $2/52$.", isCorrect: true },
            { id: "8b", text: "Drawing an Ace and drawing a Heart are mutually exclusive events.", isCorrect: false },
            { id: "8c", text: "The probability of drawing a Spade, given that the card is black, is $0.5$.", isCorrect: true },
            { id: "8d", text: "If two cards are drawn with replacement, the events are independent.", isCorrect: true },
            { id: "8e", text: "The probability of drawing at least one Jack in two draws (with replacement) is $2/13$.", isCorrect: false }
        ]
    },
    {
        id: 9,
        topic: "Macroeconomics: Monetary Policy",
        questionText: "Regarding the tools and effects of Central Bank policies:",
        statements: [
            { id: "9a", text: "Lowering the reserve requirement is an expansionary monetary policy.", isCorrect: true },
            { id: "9b", text: "To combat high inflation, a central bank should typically lower interest rates.", isCorrect: false },
            { id: "9c", text: "Open market operations involve the buying and selling of government bonds.", isCorrect: true },
            { id: "9d", text: "An increase in the money supply usually leads to a decrease in the nominal interest rate.", isCorrect: true },
            { id: "9e", text: "The central bank directly controls the long-term real interest rates in the economy.", isCorrect: false }
        ]
    },
    {
        id: 10,
        topic: "Logic and Reasoning",
        questionText: "Analyze the logical consistency of the following statements:",
        statements: [
            { id: "10a", text: "If all economists are mathematicians and some mathematicians are professors, then some economists must be professors.", isCorrect: false },
            { id: "10b", text: "The statement 'A implies B' is logically equivalent to 'Not B implies Not A'.", isCorrect: true },
            { id: "10c", text: "A 'Sunk Cost' should be a primary factor in making future investment decisions.", isCorrect: false },
            { id: "10d", text: "Correlation between two variables always implies a causal relationship.", isCorrect: false },
            { id: "10e", text: "In a zero-sum game, one player's gain is exactly equal to another player's loss.", isCorrect: true }
        ]
    }
];