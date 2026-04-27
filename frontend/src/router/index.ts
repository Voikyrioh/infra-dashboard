import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			redirect: "/dashboard",
		},
		{
			path: "/connexion",
			component: () => import("@/components/pages/LoginPage/LoginPage.vue"),
			meta: { public: true },
		},
		{
			path: "/dashboard",
			component: () =>
				import("@/components/pages/DashboardPage/DashboardPage.vue"),
		},
	],
});

router.beforeEach((to) => {
	const auth = useAuthStore();

	if (auth.isAuthenticated && to.path === "/connexion") {
		return "/dashboard";
	}

	if (!auth.isAuthenticated && !to.meta.public) {
		return "/connexion";
	}
});

export default router;
