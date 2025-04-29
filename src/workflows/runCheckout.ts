import { GitManager } from '../git-manager/GitManager.js'

const git = new GitManager()

const pullRepo = true
if (pullRepo) {
  await git.repo.clone('.')
  console.log(
    `Cloned repository ${process.env.GITHUB_REPOSITORY} to ${process.env.GITHUB_WORKSPACE}`
  )
  await git.repo.fetch('.')
  console.log('Fetched all branches and tags.')
  await git.repo.checkout('.', process.env.GITHUB_REF_NAME || '')
  console.log(`Checked out branch/tag ${process.env.GITHUB_REF_NAME}`)
  await git.repo.pull('.', process.env.GITHUB_REF_NAME || '')
  console.log(
    `Pulled latest changes from branch/tag ${process.env.GITHUB_REF_NAME}`
  )
}
