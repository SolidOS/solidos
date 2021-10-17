Cypress.Commands.add('registerAlice', () => {
    const requestOptions = {
        url: 'https://alice.localhost:8443/profile/card',
        failOnStatusCode: false,
    };

    cy.request(requestOptions).then(({ isOkStatusCode }) => {
        if (isOkStatusCode) {
            // Already registered.

            return;
        }

        cy.registerUser({
            name: 'Alice',
            username: 'alice',
            email: 'alice@example.com',
        });
    });
});

Cypress.Commands.add('registerUser', (user) => {
    cy.visit('/');
    cy.contains('Register').click();
    cy.get('[name="username"]').type(user.username);
    cy.get('[name="password"]').type('Secret123456!');
    cy.get('[name="repeat_password"]').type('Secret123456!');
    cy.get('[name="name"]').type(user.name);
    cy.get('[name="email"]').type(user.email);
    cy.get('[name="acceptToc"]').click();
    cy.contains('button', 'Register').click();
    cy.contains(`View ${user.name}'s files`, { includeShadowDom: true }).should('be.visible');
});
