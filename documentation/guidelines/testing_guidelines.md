# 🤗 Welcome CONTRIBUTOR

This document helps contributors improve testing habits with guidelines and know-how.

Tbale of content:

- [🤗 Welcome CONTRIBUTOR](#-welcome-contributor)
  - [Testing guidelines](#testing-guidelines)
  - [Testing strategy](#testing-strategy)
  - [Testing know-how](#testing-know-how)
    - [Videos about testing knowledge transfer](#videos-about-testing-knowledge-transfer)
    - [General information](#general-information)
    - [Data fixtures](#data-fixtures)
    - [Using custom matchers](#using-custom-matchers)

## Testing guidelines

- When you fix a bug, start by creating a test to reproduce it, and then fix it.
- Tests throughout the SolidOS stack should be in dedicated folders called 'test'.

## Testing strategy

- At first, we will work to have more integration tests, as it is currently hard to write unit tests. As time goes on, it will eventually flip. At the same time, we will refactor code to be more modular to do unit tests.
- Both unit tests and integration tests will be in all repos.
- No end-to-end (e2e) tests currently; we may do some of these outside of the repos.
- Add `rdflib` to the list of repos to be tested.

## Testing know-how

### Videos about testing knowledge transfer

The SolidOS team did a few workshops and presentations about how to do testing in general and on the SolidOS stack. You can revisit them [here](https://solidos.solidcommunity.net/public/SolidOS%20team%20meetings/SolidOS_team_videos.html).

### General information

The original code was not written with testing in mind. To make testing more efficient, you may find it easier to export a function. To do this, include the following comment above the function so that it does not get picked up by `Typedoc`.
`@ignore exporting this only for the unit test`

There will also be times that even exporting the function isn't enough to enable proper tests to be developed.
In this case, follow the commenting procedures in the Code `Readme.md`, which is to add the comment
` \* @@ TODO` and describe the problem.

You can reference <https://github.com/solidos/solid-ui/issues/215> in your [`TODO` comment](./coding_guidelines.md#adding-a-todo) if the code is hard to test due to DOM manipulation.

### Data fixtures

See <https://github.com/solidos/solid-ui/blob/5fd8fb0/test/unit/widgets/buttons.test.ts#L222> for an example of how to use `store.add` in a
unit test to set up some data in the store. Don't forget to [`clearStore afterEach`](https://github.com/solidos/solid-ui/blob/5fd8fb0/test/unit/widgets/buttons.test.ts#L214).

### Using custom matchers

We have added some custom matchers to ease the testing. You can see the full list at `test/setup.ts`, in
the `expect.extend` part.

- `expect(A).toEqualGraph(B)`: Use this matcher to check whether graphs A and B are equal (meaning containing the
  same set of triples)
- `expect(A).toContainGraph(B)`: Use this matcher to check whether graph B is contained in graph A.
