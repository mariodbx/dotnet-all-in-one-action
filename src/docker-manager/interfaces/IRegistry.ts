export interface IRegistry {
  qualifyImageName(image: string): string
  login(showFullOutput: boolean): Promise<string>
}
