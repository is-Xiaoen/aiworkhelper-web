// vite.config.ts
import { defineConfig } from "file:///F:/%E6%A1%8C%E9%9D%A2/AI%E5%8A%A9%E6%89%8B/aiworkhelper-web/aiworkhelper-web/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.25/node_modules/vite/dist/node/index.js";
import vue from "file:///F:/%E6%A1%8C%E9%9D%A2/AI%E5%8A%A9%E6%89%8B/aiworkhelper-web/aiworkhelper-web/node_modules/.pnpm/@vitejs+plugin-vue@5.2.4_vi_48fb5fb17678bfeab2f205615c6bb913/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { resolve } from "path";
import AutoImport from "file:///F:/%E6%A1%8C%E9%9D%A2/AI%E5%8A%A9%E6%89%8B/aiworkhelper-web/aiworkhelper-web/node_modules/.pnpm/unplugin-auto-import@0.17.8_1b300706683abc34f1951ea045a30d5c/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///F:/%E6%A1%8C%E9%9D%A2/AI%E5%8A%A9%E6%89%8B/aiworkhelper-web/aiworkhelper-web/node_modules/.pnpm/unplugin-vue-components@0.2_37a27e24b156779cc9fa508a7f556b10/node_modules/unplugin-vue-components/dist/vite.js";
import { ElementPlusResolver } from "file:///F:/%E6%A1%8C%E9%9D%A2/AI%E5%8A%A9%E6%89%8B/aiworkhelper-web/aiworkhelper-web/node_modules/.pnpm/unplugin-vue-components@0.2_37a27e24b156779cc9fa508a7f556b10/node_modules/unplugin-vue-components/dist/resolvers.js";
var __vite_injected_original_dirname = "F:\\\u684C\u9762\\AI\u52A9\u624B\\aiworkhelper-web\\aiworkhelper-web";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ["vue", "vue-router", "pinia"]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "src")
    }
  },
  server: {
    port: 3e3,
    proxy: {
      "/v1": {
        target: "http://127.0.0.1:8888",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJGOlxcXFxcdTY4NENcdTk3NjJcXFxcQUlcdTUyQTlcdTYyNEJcXFxcYWl3b3JraGVscGVyLXdlYlxcXFxhaXdvcmtoZWxwZXItd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJGOlxcXFxcdTY4NENcdTk3NjJcXFxcQUlcdTUyQTlcdTYyNEJcXFxcYWl3b3JraGVscGVyLXdlYlxcXFxhaXdvcmtoZWxwZXItd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9GOi8lRTYlQTElOEMlRTklOUQlQTIvQUklRTUlOEElQTklRTYlODklOEIvYWl3b3JraGVscGVyLXdlYi9haXdvcmtoZWxwZXItd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tICd1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlJ1xuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSdcbmltcG9ydCB7IEVsZW1lbnRQbHVzUmVzb2x2ZXIgfSBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy9yZXNvbHZlcnMnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgQXV0b0ltcG9ydCh7XG4gICAgICByZXNvbHZlcnM6IFtFbGVtZW50UGx1c1Jlc29sdmVyKCldLFxuICAgICAgaW1wb3J0czogWyd2dWUnLCAndnVlLXJvdXRlcicsICdwaW5pYSddXG4gICAgfSksXG4gICAgQ29tcG9uZW50cyh7XG4gICAgICByZXNvbHZlcnM6IFtFbGVtZW50UGx1c1Jlc29sdmVyKCldXG4gICAgfSlcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjJylcbiAgICB9XG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgcHJveHk6IHtcbiAgICAgICcvdjEnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODg4OCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBZ1csU0FBUyxvQkFBb0I7QUFDN1gsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZTtBQUN4QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixTQUFTLDJCQUEyQjtBQUxwQyxJQUFNLG1DQUFtQztBQVF6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixXQUFXO0FBQUEsTUFDVCxXQUFXLENBQUMsb0JBQW9CLENBQUM7QUFBQSxNQUNqQyxTQUFTLENBQUMsT0FBTyxjQUFjLE9BQU87QUFBQSxJQUN4QyxDQUFDO0FBQUEsSUFDRCxXQUFXO0FBQUEsTUFDVCxXQUFXLENBQUMsb0JBQW9CLENBQUM7QUFBQSxJQUNuQyxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUMvQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLE9BQU87QUFBQSxRQUNMLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
