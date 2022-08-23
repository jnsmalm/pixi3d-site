interface Demo {
  load: () => Promise<void>
  show: () => void
}

export namespace Loader {
  export async function load(demo: Demo) {
    await demo.load();
    demo.show();
    setTimeout(() => {
      document.getElementById("load")?.classList.add("opacity-0", "pointer-events-none");
    }, 1000);
  }
}