# :warning: WORK IN PROGRESS :warning:

This action is still in an experimental phase, to use with discretion.

# Dotnet All-in-One GitHub Action

A GitHub Action for .NET projects that automates migrations, tests, versioning,
Docker image building, and release management. This action is designed to
streamline CI/CD workflows for .NET applications.

---

## Features

- **EF Core Migrations**: Automatically applies pending migrations with rollback
  support.
- **Testing**: Runs .NET tests, captures results, and uploads them as artifacts.
- **Versioning**: Extracts and bumps versions from `.csproj` files or commit
  messages.
- **Docker**: Builds and pushes Docker images with versioned and `latest` tags.
- **Release Management**: Generates changelogs and creates GitHub releases.
- **Customizable Inputs**: Configure paths, environment variables, and other
  parameters.

---

## Usage

To use this action in your workflow, include it in your `.github/workflows` YAML
file. Combine it with `setup-dotnet` to build, restore, and manage your .NET
projects seamlessly.

### Example Workflow

```yml
name: Build, Test, and Release

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  build-test-release:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: 8.0.x

      - name: Install Dependencies
        run: dotnet restore

      - name: Run Dotnet All-in-One Action
        uses: ./ # Use the local action or replace with the repository path
        with:
          run_migrations: true
          migrations_folder: ./src/Migrations
          rollbackMigrationsOnTestFailed: true
          test_folder: ./tests/MyTestProject
          test_output_folder: TestResults
          test_format: trx
          run_versioning: true
          csproj_name: '*.csproj'
          use_commit_message: true
          docker_push_status: success
          push_with_version: true
          push_with_latest: true
          run_release_and_changelog: true

      - name: Publish Test Results
        uses: actions/upload-artifact@v4
        with:
          name: TestResults
          path: TestResults
```

---

## Inputs

Below is a detailed list of all inputs supported by this action, grouped by
functionality.

### General

| Input Name         | Description                                                               | Required | Default Value |
| ------------------ | ------------------------------------------------------------------------- | -------- | ------------- |
| `show_full_output` | Whether to capture the full output of executed commands (`true`/`false`). | No       | `false`       |
| `home_directory`   | The home directory for the action.                                        | No       | `/home/node`  |

---

### Migrations

| Input Name                           | Description                                                            | Required | Default Value     |
| ------------------------------------ | ---------------------------------------------------------------------- | -------- | ----------------- |
| `run_migrations`                     | Run EF Core migrations (`true`/`false`).                               | No       | `true`            |
| `migrations_folder`                  | Path to the folder containing EF Core migrations.                      | No       | `./Migrations`    |
| `env_name`                           | Environment name for ASP.NET Core (e.g., `Development`, `Production`). | No       | `Test`            |
| `dotnet_root`                        | Path to the .NET root directory.                                       | No       | `/usr/bin/dotnet` |
| `use_global_dotnet_ef`               | Use globally installed `dotnet-ef` instead of a local installation.    | No       | `false`           |
| `rollback_migrations_on_test_failed` | Rollback migrations if tests fail (`true`/`false`).                    | No       | `false`           |

#### How to Use

```yml
with:
  run_migrations: true
  migrations_folder: ./src/Migrations
  env_name: Production
  rollback_migrations_on_test_failed: true
```

---

### Testing

| Input Name               | Description                                            | Required | Default Value  |
| ------------------------ | ------------------------------------------------------ | -------- | -------------- |
| `run_tests`              | Run tests (`true`/`false`).                            | No       | `true`         |
| `run_tests_migrations`   | Run tests on migrations (`true`/`false`).              | No       | `true`         |
| `test_migrations_folder` | Path to the folder containing test migrations.         | No       | `./Migrations` |
| `test_folder`            | Path to the folder containing test projects.           | Yes      | N/A            |
| `test_output_folder`     | Path to the folder where test results will be stored.  | No       | `TestResults`  |
| `test_format`            | Format for test results (e.g., `trx`, `html`, `json`). | No       | `html`         |

#### How to Use

```yml
with:
  run_tests: true
  test_folder: ./tests/MyTestProject
  test_output_folder: TestResults
  test_format: trx
```

---

### Versioning

| Input Name              | Description                                                     | Required | Default Value                             |
| ----------------------- | --------------------------------------------------------------- | -------- | ----------------------------------------- |
| `run_versioning`        | Run versioning step (`true`/`false`).                           | No       | `true`                                    |
| `csproj_depth`          | Maximum depth for locating the `.csproj` file.                  | No       | `1`                                       |
| `csproj_name`           | Name pattern for the `.csproj` file (e.g., `*.csproj`).         | No       | `*.csproj`                                |
| `use_commit_message`    | Use the commit message to extract the version (`true`/`false`). | No       | `true`                                    |
| `commit_user`           | The Git commit username.                                        | No       | `github-actions`                          |
| `commit_email`          | The Git commit email.                                           | No       | `github-actions@users.noreply.github.com` |
| `commit_message_prefix` | Prefix for the commit message.                                  | No       | `chore: bump version to `                 |

#### How to Use

```yml
with:
  run_versioning: true
  csproj_name: '*.csproj'
  use_commit_message: true
  commit_user: github-actions
  commit_email: github-actions@users.noreply.github.com
```

---

### Docker

| Input Name             | Description                                                                   | Required | Default Value |
| ---------------------- | ----------------------------------------------------------------------------- | -------- | ------------- |
| `run_push_to_registry` | Push images to the registry (`true`/`false`).                                 | No       | `true`        |
| `docker_compose_files` | Comma-separated list of Docker Compose files to build images from.            | No       | N/A           |
| `images`               | Comma-separated list of image repositories (used with Docker Compose builds). | No       | N/A           |
| `dockerfiles`          | Comma-separated list of Dockerfile paths (for Dockerfile builds).             | No       | N/A           |
| `dockerfile_images`    | Comma-separated list of image names corresponding to each Dockerfile.         | No       | N/A           |
| `dockerfile_contexts`  | Comma-separated list of build contexts for each Dockerfile.                   | No       | `.`           |
| `registry_type`        | Type of container registry (e.g., `ghcr`, `acr`, `dockerhub`).                | No       | `GHCR`        |
| `push_with_version`    | Push images tagged with the version (`true`/`false`).                         | No       | `true`        |
| `push_with_latest`     | Push images tagged as `latest` (`true`/`false`).                              | No       | `true`        |

#### How to Use

```yml
with:
  run_push_to_registry: true
  dockerfiles: ./Dockerfile
  dockerfile_images: my-app
  push_with_version: true
  push_with_latest: true
```

---

### Release and Changelog

| Input Name                  | Description                                                          | Required | Default Value            |
| --------------------------- | -------------------------------------------------------------------- | -------- | ------------------------ |
| `run_release_and_changelog` | Run release and changelog step (`true`/`false`).                     | No       | `true`                   |
| `major_keywords`            | Comma-separated list of keywords to detect major changes.            | No       | `breaking, overhaul`     |
| `minor_keywords`            | Comma-separated list of keywords to detect minor changes.            | No       | `feature, enhancement`   |
| `patch_keywords`            | Comma-separated list of keywords to detect patch or bug fix changes. | No       | `bug-fix, hotfix, patch` |
| `hotfix_keywords`           | Comma-separated list of keywords to detect hotfix changes.           | No       | `urgent, hotfix`         |
| `added_keywords`            | Comma-separated list of keywords to detect additions.                | No       | `added, new`             |
| `dev_keywords`              | Comma-separated list of keywords to detect development changes.      | No       | `dev, experiment`        |

#### How to Use

```yml
with:
  run_release_and_changelog: true
  major_keywords: breaking
  minor_keywords: feature
  patch_keywords: bug-fix
```

---

## Outputs

| Output Name          | Description                                         |
| -------------------- | --------------------------------------------------- |
| `lastMigration`      | The last applied database migration.                |
| `startTime`          | The time when the workflow started.                 |
| `endTime`            | The time when the workflow finished.                |
| `version`            | Extracted version from `.csproj` or commit message. |
| `current_version`    | The current version before the bump.                |
| `new_version`        | The new version after the bump.                     |
| `bump_type`          | The type of version bump (major, minor, patch).     |
| `docker_push_status` | Status of Docker image push (success/failure).      |
| `changelog`          | Generated changelog for the release.                |
| `release_status`     | Status of the release creation (success/failure).   |

---

## How It Works

### 1. Migrations

- If `run_migrations` is `true`, the action applies pending EF Core migrations
  from the specified `migrations_folder`.
- If tests fail and `rollbackMigrationsOnTestFailed` is enabled, the action
  rolls back the applied migrations to maintain database consistency.

#### Example

```yml
with:
  run_migrations: true
  migrations_folder: ./src/Migrations
  rollbackMigrationsOnTestFailed: true
```

### 2. Testing

- Runs tests in the specified `test_folder`.
- Saves test results in the `test_output_folder` in the specified `test_format`
  (e.g., `trx`, `html`, `json`).
- Uploads test results as artifacts for later inspection.

#### Example

```yml
with:
  test_folder: ./tests/MyTestProject
  test_output_folder: TestResults
  test_format: trx
```

### 3. Versioning

- Extracts the version from `.csproj` files or commit messages.
- Bumps the version based on commit keywords (e.g., `breaking`, `feature`,
  `fix`).

#### Example

```yml
with:
  run_versioning: true
  csproj_name: '*.csproj'
  use_commit_message: true
```

### 4. Docker

- Builds Docker images and tags them with the extracted version and `latest`.
- Pushes the images to the specified container registry.

#### Example

```yml
with:
  docker_push_status: success
  push_with_version: true
  push_with_latest: true
```

### 5. Release Management

- Generates a changelog based on commit messages.
- Creates a GitHub release with the changelog and version information.

#### Example

```yml
with:
  run_release_and_changelog: true
```

---

## Requirements

- **.NET SDK**: Ensure the .NET SDK is installed on the runner.
- **EF Core Tools**: If using migrations, ensure `dotnet-ef` is installed.

---

## Notes

- Ensure paths like `test_folder` and `migrations_folder` are correctly set
  relative to the repository root.
- Use the `rollbackMigrationsOnTestFailed` input to ensure database consistency
  in case of test failures.
- For Docker and release management, ensure the appropriate permissions and
  secrets are configured in your repository.
