# 🤗 Welcome CONTRIBUTOR

This is a document about using AI in SolidOS repositories.

Table of contents:

- [General rules](#general-rules)
- [Example commits written with AI](#2-example-commits-written-with-ai)

## General rules

The SolidOS team uses AI to code. As of June 2026, Copilot in VS Code seems to be the preferred way.

We want to kindly ask ALL contributors to adhere to the following:

- if you are using AI to write code that is 100% written with AI, you NEED to add this to your commit.
- you do not need to add such a commit if you are writing: tests, refactoring (unless very heavy), or fixing bugs (unless it adds/changes a lot of the existing code).

### 2 example commits, co-authored with AI:

Example 1:
    
    #769 Soften CSS resets
    Prompt: We're using the tailwindcss preflight resets in @src/primitives/styles/common.styles.css, but they have an overly aggressive selector that resets the margin and padding of any element. This is a problem because styling web component elements using :host in their own styles take less precedence in the situations were nested components are rendered. Use the patch-package utility to modify the built-in preflight and remove the padding and margin resets in the * selector. Instead, create a new rule that only resets padding and margin for built-in elements.
    
    Summary of Changes:
    
    1. Modified Preflight Styles: Updated preflight.css to:
      • Remove  margin: 0;  and  padding: 0;  from the universal  *  selector rule.
      • Create a new rule resetting margins and paddings only for standard built-in HTML tags and pseudo-elements (such as  ::after ,  ::before ,  ::backdrop ,
      ::file-selector-button ).
    2. Generated Patch: Ran  npx patch-package tailwindcss  to generate the patch file at tailwindcss+4.3.0.patch.
    3. Staged and Verified:
      • Verified that  npm run typecheck && npm run build  and  npm run test  compile and pass without issues.
      • Staged the patch file along with the formatting tweak in package.json.
    
    Co-Authored-By: Antigravity CLI (Gemini 3.5 Flash) <bot@antigravity.local>

Example 2:

    docs: improve ticket labeling table to match lifecycle diagram
    Prompt: On the SolidOS repo, we have a big README. I would like to add a
    contributing.md which contains all the information that newcomers or current
    devs need to be able to contribute to the SolidOS repositories. Pls suggest
    a structure for it and copy over the relevant text. In addition, add a section
    about the ticket labeling and use this photo
    
    Co-authored-by: GitHub Copilot (claude-sonnet-4.6) <copilot@github.com>

In order to write such a commit, see the [GitHub guidelines](https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors).
And visit some of our past commits:
- [solid-ui Update account components in header commit](https://github.com/SolidOS/solid-ui/pull/775/changes/9779714ad33923da82de150517a8e77c662cb52e)
- [solidOS improve ticket labeling table to match lifecycle diagram commit](https://github.com/SolidOS/solidos/commit/c40118b3c8f32fd7ed69e1e9d40ccfdd454f644d)
