export default defineBackground(() => {
  const action = (browser as any).action ?? (browser as any).browserAction;
  if (!action) return;

  action.onClicked.addListener(() => {
    browser.tabs.create({ url: browser.runtime.getURL("settings.html") });
  });
});
