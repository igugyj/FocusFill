import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/auto-icons"],
  autoIcons: {
    baseIconPath: "assets/icon.png",
    sizes: [128, 96, 48, 32, 16],
    developmentIndicator: false,
  },
  manifestVersion: 3,
  manifest: {
    name: "FocusFill",
    description:
      "Click a field to get a fill hint beside it. Fills saved personal info locally.",
    author: "Pfolg",
    homepage_url: "https://github.com/igugyj/FocusFill",
    permissions: ["storage"],
    host_permissions: ["http://*/*", "https://*/*"],
    action: {
      default_title: "FocusFill 设置",
    },
    browser_specific_settings: {
      gecko: {
        id: "focusfill@igugyj.github.io",
        strict_min_version: "121.0",
        data_collection_permissions: {
          required: ["none"],
        },
      } as any,
    },
  },
});
