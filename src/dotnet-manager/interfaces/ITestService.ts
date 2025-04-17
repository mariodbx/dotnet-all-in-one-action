export interface ITestService {
  runTests(
    envName: string,
    testFolder: string,
    testOutputFolder: string,
    testFormat?: string
  ): Promise<void>
}
