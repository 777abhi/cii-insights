export async function getAllTestCases(fetchImpl: typeof fetch = fetch): Promise<string[]> {
  const endpointTestCases = 'https://api.zephyrscale.smartbear.com/v2/testcases';
  const endpointTestExecutions = 'https://api.zephyrscale.smartbear.com/v2/testexecutions';
  const projectKey = 'YOUR_PROJECT_KEY'; // Replace with your actual project key
  const maxResults = 10;

  let startAt = 0;
  let allTestCases = new Set();
  let testExecutionsTestCases = new Set();

  // Fetch and merge filtered test cases from the first endpoint
  do {
    const queryParamsTestCases = new URLSearchParams({
      projectKey,
      maxResults: maxResults.toString(),
      startAt: startAt.toString(),
    });

    const responseTestCases = await fetchImpl(`${endpointTestCases}?${queryParamsTestCases}`);
    const dataTestCases = await responseTestCases.json();

    const filteredTestCases = dataTestCases.values.filter(
      (testCase) =>
        testCase.customFields.Implemented === false &&
        testCase.precondition.toLowerCase().includes('smoke')
    );

    const testCaseKeysTestCases = filteredTestCases.map((testCase) => testCase.key);
    testCaseKeysTestCases.forEach((testCaseKey) => {
      allTestCases.add(testCaseKey);
      testExecutionsTestCases.add(testCaseKey);
    });

    startAt += maxResults;
  } while (startAt < dataTestCases.total);

  startAt = 0; // Reset startAt for the second endpoint

  // Fetch and merge test cases from the second endpoint
  do {
    const queryParamsTestExecutions = new URLSearchParams({
      projectKey,
      maxResults: maxResults.toString(),
      startAt: startAt.toString(),
    });

    const responseTestExecutions = await fetchImpl(`${endpointTestExecutions}?${queryParamsTestExecutions}`);
    const dataTestExecutions = await responseTestExecutions.json();

    const filteredTestExecutions = dataTestExecutions.values.filter(
      (testExecution) =>
        testExecution.automated &&
        testExecution.testCase &&
        testExecution.testCase.self.includes('/rest/api/v2/testCases/') &&
        testExecution.testCase.self.includes('/versions/')
    );

    const testCaseKeysTestExecutions = filteredTestExecutions.map((testExecution) => {
      const match = testExecution.testCase.self.match(/\/rest\/api\/v2\/testCases\/([A-Z0-9-]+)\/versions/);
      return match ? match[1] : null;
    });

    testCaseKeysTestExecutions.forEach((testCaseKey) => {
      allTestCases.add(testCaseKey);
      testExecutionsTestCases.add(testCaseKey);
    });

    startAt += maxResults;
  } while (startAt < dataTestExecutions.total);

  // Filter final result to include only test cases present in testexecutions
  const finalTestCases = Array.from(allTestCases).filter((testCase) => testExecutionsTestCases.has(testCase));

  return finalTestCases as string[];
}
