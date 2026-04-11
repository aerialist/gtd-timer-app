describe('GTD Timer', () => {

  it('should display initial timer as 2:00', async () => {
    const timer = await $('#digitalTimer');
    const text = await timer.getText();
    expect(text).toBe('2:00');
  });

  it('should start counting down when timer circle is clicked', async () => {
    const circle = await $('#timerCircle');
    await circle.click();
    await browser.pause(1500);

    const timer = await $('#digitalTimer');
    const text = await timer.getText();
    // Should no longer be 2:00 after 1.5s
    expect(text).not.toBe('2:00');
    // Should still be close to 2:00 (e.g. 1:58 or 1:59)
    expect(text).toMatch(/^1:\d{2}$/);
  });

  it('should pause when clicked again', async () => {
    const circle = await $('#timerCircle');
    await circle.click(); // pause
    await browser.pause(500);

    const timer = await $('#digitalTimer');
    const textAtPause = await timer.getText();
    await browser.pause(1000);
    const textAfterWait = await timer.getText();

    // Timer should not change while paused
    expect(textAtPause).toBe(textAfterWait);
  });

  it('should reset to 2:00 when digital timer is single-clicked', async () => {
    const digitalTimer = await $('#digitalTimer');
    await digitalTimer.click();
    await browser.pause(500);

    const text = await digitalTimer.getText();
    expect(text).toBe('2:00');
  });

  it('should show duration input overlay on double-click', async () => {
    const digitalTimer = await $('#digitalTimer');
    await digitalTimer.doubleClick();
    await browser.pause(500);

    const overlay = await $('#durationOverlay');
    const isDisplayed = await overlay.isDisplayed();
    expect(isDisplayed).toBe(true);
  });

  it('should change duration to 5 minutes after input', async () => {
    // overlay should already be open from previous test
    const input = await $('#durationInput');
    await input.clearValue();
    await input.setValue('5');
    await browser.keys(['Enter']);
    await browser.pause(400);

    const timer = await $('#digitalTimer');
    const text = await timer.getText();
    expect(text).toBe('5:00');
  });

  it('should reset to new duration (5:00) after single-click', async () => {
    // Start timer briefly
    const circle = await $('#timerCircle');
    await circle.click();
    await browser.pause(1000);
    await circle.click(); // pause

    // Reset
    const digitalTimer = await $('#digitalTimer');
    await digitalTimer.click();
    await browser.pause(400);

    const text = await digitalTimer.getText();
    expect(text).toBe('5:00');
  });

  it('cycle counter element exists and shows correct format when visible', async () => {
    // Reset duration back to 2 min via double-click
    const digitalTimer = await $('#digitalTimer');
    await digitalTimer.doubleClick();
    await browser.pause(400);

    const input = await $('#durationInput');
    await input.clearValue();
    await input.setValue('2');
    await browser.keys(['Enter']);
    await browser.pause(400);

    // Verify element is in DOM and has correct text
    const cycleCounter = await $('#cycleCounter');
    const exists = await cycleCounter.isExisting();
    expect(exists).toBe(true);

    // cycleCounter has opacity:0 when 0 cycles (not visible), so getText() returns ""
    // Verify via JS instead
    const text = await browser.execute(el => el.textContent, cycleCounter);
    expect(text).toBe('0 cycles');
  });

});
