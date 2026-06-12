# 🤗 Welcome CONTRIBUTOR

This is a document about using AI in SolidOS repositories.

Table of contents:

- [General rules](#general-rules)
- [Example commits written with AI](#2-example-commits-written-with-ai)

## General rules

The SolidOS team uses AI to code. As of June 2026, Copilot in VScode seems to be the prefered way.

We want to kindly ask ALL contributors to adhere to the following:

- if you are using AI to write code that is 100% written with AI you NEED to add this to your commit.
- you do not need to add such a commit if you are writting: tests, refactoring (unless very heavy), or fixing bugs (unless it adds/changes a lot of the existin code).

### 2 example commits, written with AI:

    Author: Harry Hacker hh@example.org
    Date: Sun Jan 18 10:32:15 2026
    Fix complicated auth bug
    Fix several mistakes in auth code, make it compile; added test

   
    Author: Harry Hacker with CodeLLM-3.4 hh@example.org
    Date: Sun Jan 18 10:52:08 2026
    Generate modal code
    Prompt: Generate a dialog modal for user confirmation.
    Output: (this commit) 

In order to write such a commit see the [GitHub guidelines](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors).
And visit some of our past commits:
- [solid-ui Update account components in header commit](https://github.com/SolidOS/solid-ui/pull/775/changes/9779714ad33923da82de150517a8e77c662cb52e)
- [solidOS improve ticket labeling table to match lifecycle diagram commit](https://github.com/SolidOS/solidos/commit/c40118b3c8f32fd7ed69e1e9d40ccfdd454f644d)
