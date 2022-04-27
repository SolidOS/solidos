# 🤗 Welcome CONTRIBUTOR

This is a document about coding guidelines and processes. These topics reflect the way SolidOS stack contributors work.

Table of content:

- [🤗 Welcome CONTRIBUTOR](#-welcome-contributor)
  - [General rules](#general-rules)
  - [Documenting your code](#documenting-your-code)
    - [General comments](#general-comments)
    - [Adding a TODO](#adding-a-todo)
  - [Refactoring code](#refactoring-code)
    - [Conversion to TypeScript](#conversion-to-typescript)
  - [Windows developers](#windows-developers)

## General rules

- In any given branch/PR, there should be no more than a couple files modified. In general, try to stick to one, though you may need two for testing — one for the test, and one for the code you are testing.
- Name branch as you want.
- include **WIP** in the title of the PR if you want a review.

## Documenting your code

### General comments

In general, if the code is clean, it is easy to understand the algorithm, but sometimes it may make sense to include comments to explain or give an example.

Comment blocks look like this:

```js
/**
 * comments
 * more comments
 */
 ```

 One-line comments look like this:

 ```js
  // comments
  doSomething()
 */
 ```

### Adding a TODO

An example when you need a TODO is when you refactor code. There will be times you run across code that cannot be easily changed or may be better suited for an alternate branch. In this case you can:

1. Create a follow-up issue
2. Document the code by a comment as shown below
   `/* @@ TODO comment about what needs to be done and/or why it is a problem, see [link to issue]`

## Refactoring code

### Conversion to TypeScript

Steps:

1. Rename file to .ts
2. Add types to public methods (if this is dificult you can add the 'any' type and add comments as described above to indicate it needs further work)
3. Add comments
4. No Logic changes, only minor refactoring
5. PR is reviewed by one other engineer and merged to `main` branch
6. Write unit tests
7. Write examples
8. Refactor

## Windows developers

Notes: can't use single quotes in scripts. Need to use `\" instead
Need to run builds using bash because of sh command.
