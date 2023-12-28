// https://on.cypress.io/api

describe('Check if 404 error page is working', () => {
       it('visits the app root url', () => {
              cy.visit('/egerger')
              cy.contains('h1', 'Error 404')
       })
})
