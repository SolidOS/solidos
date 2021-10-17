describe('Authentication', () => {

    it('Signs up', () => {
        const randomString = Math.random().toString().substr(2, 8);

        cy.registerUser({
            name: `Alice ${randomString}`,
            username: `alice-${randomString}`,
            email: `alice-${randomString}@example.com`,
        });
    });

    it.skip('Logs in', () => {
        cy.registerAlice();
        cy.visit('https://alice.localhost:8443/profile/card');
        cy.get('input[type="button"][value="Log in"]').click();
        cy.get('input[placeholder="https://example.com"]').type('https://alice.localhost:8443');
        cy.contains('button', 'Go').click();
        cy.get('[name="username"]').type('alice');
        cy.get('[name="password"]').type('Secret123456!');
        cy.contains('button', 'Log In').click();
        cy.get('.header-user-menu > button').click();
        cy.contains('Your stuff').should('be.visible');
    });

});
