import plugin from "../plugin.json";

class AcodePlugin {
	public baseUrl: string | undefined;
	private observer: MutationObserver | null = null;
	private raf = 0;

	async init($page: Acode.WCPage, cacheFile: Acode.FileSystem, cacheFileUrl: string): Promise<void> {
		void $page;
		void cacheFile;
		void cacheFileUrl;

		const stripLastExtension = (name: string): string => {
			const text = String(name || "").trim();
			const lastDot = text.lastIndexOf(".");
			if (lastDot <= 0) return text;
			return text.slice(0, lastDot);
		};

		const updateFileNames = (root: ParentNode = document): void => {
			const nodes = root.querySelectorAll<HTMLElement>('.tile[data-type="file"] span.text');

			nodes.forEach(node => {
				const original = node.textContent?.trim() ?? "";
				const stripped = stripLastExtension(original);

				if (stripped !== original) {
					node.textContent = stripped;
				}
			});
		};

		const scheduleUpdate = (): void => {
			if (this.raf) return;

			this.raf = window.requestAnimationFrame(() => {
				this.raf = 0;
				updateFileNames();
			});
		};

		const startObserver = (): void => {
			if (this.observer || !document.body) return;

			this.observer = new MutationObserver(scheduleUpdate);
			this.observer.observe(document.body, {
				childList: true,
				subtree: true,
				characterData: true
			});
		};

		updateFileNames();
		startObserver();

		this.observer = this.observer ?? null;
	}

	async destroy(): Promise<void> {
		if (this.observer) {
			this.observer.disconnect();
			this.observer = null;
		}

		if (this.raf) {
			window.cancelAnimationFrame(this.raf);
			this.raf = 0;
		}
	}
}

if (window.acode) {
	const acodePlugin = new AcodePlugin();

	acode.setPluginInit(plugin.id, async (baseUrl: string, $page: Acode.WCPage, { cacheFileUrl, cacheFile }: Acode.PluginInitOptions) => {
		if (!baseUrl.endsWith("/")) {
			baseUrl += "/";
		}

		acodePlugin.baseUrl = baseUrl;
		await acodePlugin.init($page, cacheFile, cacheFileUrl);
	});

	acode.setPluginUnmount(plugin.id, () => {
		void acodePlugin.destroy();
	});
}
