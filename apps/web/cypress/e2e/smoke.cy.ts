describe("dashboard smoke", () => {
  it("renders dashboard header", () => {
    cy.visit("/");
    cy.contains("FinIntel Dashboard").should("be.visible");
  });
});
