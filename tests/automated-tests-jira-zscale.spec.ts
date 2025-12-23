import { expect, test } from "@playwright/test";
import { getAllTestCases } from "../tests-examples/automated-tests-jira-zscale";

type MockResponse = {
  values: any[];
  total: number;
};

const testcasePage: Record<string, MockResponse> = {
  "0": {
    total: 2,
    values: [
      { key: "TC-1", precondition: "Smoke setup", customFields: { Implemented: false } },
      { key: "TC-2", precondition: "Non smoke", customFields: { Implemented: false } },
    ],
  },
  "10": { total: 2, values: [] },
};

const testexecutionPage: Record<string, MockResponse> = {
  "0": {
    total: 2,
    values: [
      {
        automated: true,
        testCase: { self: "https://example.com/rest/api/v2/testCases/TC-1/versions/1" },
      },
      {
        automated: false,
        testCase: { self: "https://example.com/rest/api/v2/testCases/TC-3/versions/1" },
      },
    ],
  },
  "10": { total: 2, values: [] },
};

test("getAllTestCases merges and filters test cases using mocked Zephyr Scale API", async () => {
  const fetchMock = async (url: string) => {
    const parsedUrl = new URL(url);
    const startAt = parsedUrl.searchParams.get("startAt") ?? "0";

    let responseBody: MockResponse | undefined;
    if (url.includes("/testcases")) {
      responseBody = testcasePage[startAt];
    } else if (url.includes("/testexecutions")) {
      responseBody = testexecutionPage[startAt];
    }

    return {
      async json() {
        return responseBody ?? { total: 0, values: [] };
      },
    };
  };

  const result = await getAllTestCases(fetchMock as any);
  expect(result).toEqual(["TC-1"]);
});
