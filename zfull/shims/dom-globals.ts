export {};

/* node-forge 1.4.0 ships no types. The project's own d.ts
 * (services/src/runtime-tools/node-forge.d.ts) is an ambient file that
 * scriptc does not auto-load, so inline the same declarations here. */
declare module "node-forge" {
  interface ForgeKey {
    n?: unknown;
  }
  interface ForgeKeyPair {
    publicKey: ForgeKey;
    privateKey: ForgeKey;
  }
  interface ForgeCertAttr {
    name?: string;
    shortName?: string;
    type?: string;
    value?: string;
  }
  interface ForgeCertExtension {
    name: string;
    cA?: boolean;
    critical?: boolean;
    keyCertSign?: boolean;
    cRLSign?: boolean;
    digitalSignature?: boolean;
    keyEncipherment?: boolean;
    serverAuth?: boolean;
    clientAuth?: boolean;
  }
  interface ForgeMessageDigest {
    update(msg: string): ForgeMessageDigest;
  }
  interface ForgeCertificate {
    publicKey: ForgeKey;
    serialNumber: string;
    validity: { notBefore: Date; notAfter: Date };
    setSubject(attrs: ForgeCertAttr[]): void;
    setIssuer(attrs: ForgeCertAttr[]): void;
    setExtensions(exts: ForgeCertExtension[]): void;
    sign(key: ForgeKey, md?: ForgeMessageDigest): void;
  }
  interface ForgeStatic {
    pki: {
      rsa: { generateKeyPair(bits: number): ForgeKeyPair };
      createCertificate(): ForgeCertificate;
      certificateToPem(cert: ForgeCertificate): string;
      privateKeyToPem(key: ForgeKey): string;
    };
    md: { sha256: { create(): ForgeMessageDigest } };
  }
  const forge: ForgeStatic;
  export = forge;
}

/* Minimal DOM type surface for sources that reference browser-only
 * globals. scriptc's forced lib (es2025) has no DOM, and ambient .d.ts
 * files are not auto-loaded — a shim must be pulled in via a real import
 * from the compile entry. This module is imported by zfull entries, which
 * makes these declarations visible to the whole program graph.
 *
 * Keep this deliberately small: add names only when a coverage report
 * asks for them. */
declare global {
  interface DOMRect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
  }

  interface CSSStyleDeclaration {
    display?: string;
    visibility?: string;
    opacity?: string;
    [key: string]: unknown;
  }

  interface Element {
    readonly tagName: string;
    readonly className?: string;
    readonly id?: string;
    readonly textContent?: string;
    readonly innerText?: string;
    readonly value?: string;
    readonly outerHTML: string;
    readonly parentElement: Element | null;
    getAttribute(name: string): string | null;
    hasAttribute(name: string): boolean;
    getBoundingClientRect(): DOMRect;
    matches(selector: string): boolean;
    remove(): void;
    scrollIntoView(options?: unknown): void;
    readonly children: Element[];
    readonly isConnected?: boolean;
    readonly clientWidth?: number;
    readonly clientHeight?: number;
    append(node: unknown): void;
  }

  interface HTMLElement extends Element {
    style: CSSStyleDeclaration;
    click(): void;
    focus(): void;
    setAttribute(name: string, value: string): void;
  }

  interface HTMLInputElement extends HTMLElement {
    readonly value?: string;
    checked?: boolean;
    disabled?: boolean;
  }

  interface Window {
    readonly innerWidth: number;
    readonly innerHeight: number;
    readonly scrollX: number;
    readonly scrollY: number;
    scrollBy(x: number, y: number): void;
    getComputedStyle(el: Element): CSSStyleDeclaration;
  }
  var window: Window;

  interface Document {
    readonly documentElement: Element;
    readonly body?: Element;
    readonly title: string;
    createElement(tag: string): HTMLElement;
    querySelectorAll(selectors: string): Element[];
    elementsFromPoint(x: number, y: number): Element[];
  }
  var document: Document;

  interface Location {
    href: string;
  }
  var location: Location;

  type HeadersInit = import("undici-types").HeadersInit;
  type RequestInfo = import("undici-types").RequestInfo;
}
