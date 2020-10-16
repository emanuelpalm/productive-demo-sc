"use strict";

class Publisher {
    constructor() {
        this.subscriptions = new Set();
    }

    publish(topic, data) {
        for (const [topic0, callback] of this.subscriptions) {
            if (topic === topic0) {
                try {
                    callback(data);
                }
                catch (error) {
                    console.log("Failed to publish '" + topic + "' to one subscriber", error);
                }
            }
        }
    }

    subscribe(topic, callback) {
        const subscription = [topic, callback];
        this.subscriptions.add(subscription);
        return subscription;
    }

    unsubscribe(subscription) {
        this.subscriptions.delete(subscription);
    }
}

const global = {
    publisher: new Publisher(),
};

class Widget {
    constructor(elementOrTagName = "div", attributes = {}, children = []) {
        if (elementOrTagName instanceof Node) {
            this.$element = elementOrTagName;
        }
        else {
            this.$element = document.createElement(elementOrTagName);
        }
        this.$element.___widget = this;
        this.children = [];

        for (const [key, value] of Object.entries(attributes)) {
            this.$element.setAttribute(key, value);
        }
        for (const child of children) {
            this.addChild(child);
        }
    }

    addChild(widgetOrNode) {
        let $node;
        if (widgetOrNode instanceof Widget) {
            $node = widgetOrNode.$element
        }
        else if (widgetOrNode instanceof Node) {
            $node = widgetOrNode;
        }
        else if (widgetOrNode === null || widgetOrNode === undefined || widgetOrNode === "") {
            return;
        }
        else {
            $node = document.createTextNode(widgetOrNode);
        }
        this.$element.appendChild($node);
    }

    addChildren(widgetsAndNodes) {
        let children;
        if (arguments.length != 1 || !Array.isArray(widgetsAndNodes)) {
            children = arguments;
        }
        else {
            children = widgetsAndNodes;
        }
        for (const widgetOrNode of children) {
            this.addChild(widgetOrNode);
        }
    }

    clearChildren() {
        this.$element.innerText = "";
    }

    [Symbol.iterator]() {
        const inner = this.$element.childNodes.values(); 
        return {
            next: () => {
                const item = inner.next();
                if (!item.done) {
                    const widget = item.value.___widget;
                    if (widget) {
                        return {value: widget, done: false};
                    }
                }
                return item;
            }
        };
    }

    addClass(className) {
        this.$element.classList.add(className);
    }

    hasClass(className) {
        return this.$element.classList.contains(className);
    }

    removeClass(className) {
        this.$element.classList.remove(className);
    }
}

class Action extends Widget {
    constructor(className, label, callback) {
        super("a", {"class": "Action " + className}, [label]);
        this.$element.addEventListener("click", () => {
            try {
                document.getSelection().removeAllRanges();
            }
            finally {
                this.callback();
            }
        });
        this.callback = callback;
    }
}

class Card extends Widget {
    constructor(className, label, children = [], actions = []) {
        super("div", {"class": "Card " + className});
        this.head = new Widget("div", {"class": "Head"}, [label]);
        this.body = new Widget("div", {"class": "Body"}, children);        
        this.foot = new Widget("div", {"class": "Foot"}, [
            this.actions = new Widget("div", {"class": "Actions"}, actions),
            this.status = new Status("hidden"),
        ])
        this.addChildren(this.head, this.body, this.foot);
    }

    getInput() {
        const map = new Map();
        for (const nodeOrWidget of this.body) {
            if (nodeOrWidget instanceof InputField) {
                map.set(nodeOrWidget.name, nodeOrWidget.getValue());
            }
        }
        return map;
    }
}

class InputField extends Widget {
    constructor(name, label = null, value = null, isEditable = true) {
        super("span", {"class": "InputField " + name});
        this.name = name;
        this.label = label || name;
        if (value !== null) {
            this.isEmpty = false;
            this.$element.innerText = value;
        }
        else {
            this.isEmpty = true;
        }
        this.setEditable(isEditable); 
        this.$element.addEventListener("keypress", event => {
            if (event.keyCode === 10 || event.keyCode === 13) {
                event.preventDefault();
                this.$element.blur();
            }
        });
    }

    getValue() {
        return this.isEmpty ? "" : (this.$element.innerText || "").trim();
    }

    setEditable(isEditable) {
        if (this.isEmpty) {
            this.$element.innerText = this.label;
            this.addClass("empty");
        }
        if (isEditable) {
            this._focusin = this.$element.addEventListener("focusin", () => {
                if (this.isEmpty) {
                    this.$element.innerText = "";
                    this.removeClass("empty");
                    this.isEmpty = false;
                }
                else {
                    const selection = document.getSelection();
                    selection.removeAllRanges();

                    const range = document.createRange();
                    range.selectNodeContents(this.$element);
                    selection.addRange(range);
                }
            });
            this._focusout = this.$element.addEventListener("focusout", () => {
                if ((this.$element.innerText || "").trim().length === 0) {
                    this.$element.innerText = this.label;
                    this.addClass("empty");
                    this.isEmpty = true;
                }
                else {
                    this.removeClass("empty");
                    this.isEmpty = false;
                }
            })
        }
        else {
            if (this._focusin) {
                this.$element.removeEventListener("focusin", this._focusin);
                delete this._focusin;
            }
            if (this._focusout) {
                this.$element.removeEventListener("focusout", this._focusout);
                delete this._focusout;   
            }
        }
        this.$element.setAttribute("contentEditable", isEditable ? "true" : "false");
    }
}

class Layout extends Widget {
    constructor(className, label, children = []) {
        super("section", {"class": "Layout " + className});
        this.head = new Widget("h1", {}, [label]);
        this.body = new Widget("div", {"class": "Body"}, children);
        this.addChildren(this.head, this.body);
    }
}

class Modal extends Widget {
    constructor($element) {
        super($element);

        const styles = window.getComputedStyle($element);

        this._display = styles.getPropertyValue("display");

        const transitionDuration = styles.getPropertyValue("transition-duration");
        this._delay = transitionDuration
            ? parseFloat(transitionDuration) || 0
            : 0;

        $element.addEventListener("click", event => {
            if (event.target === $element) {
                this.hide();
            }
        });
        this.$element.style.display = "none";
    }

    hide() {
        this.removeClass("visible");
        this._setDisplayNoneAfterDelay();
    }

    show() {
        this.addClass("visible");
        this.$element.style.display = this._display;
    }

    _setDisplayNoneAfterDelay(value) {
        if (this._delay > 0) {
            setTimeout(() => this.$element.style.display = "none", this._delay * 1000);
        }
        else {
            this.$element.style.display = value;
        }
    }
}

class Status extends Widget {
    constructor() {
        super("div", {"class": "Status hidden"});
        this.name = "hidden";
        this.$element.addEventListener("click", () => this.setHidden());
    }

    set(className, text) {
        if (this.name) {
            this.removeClass(this.name);
        }
        this.name = className;
        this.addClass(className);
        this.$element.innerText = text;
    }

    setError(text) {
        this.set("error", text);
    }

    setHidden() {
        this.set("hidden", "");
    }

    setInfo(text) {
        this.set("info", text);
    }

    setOk(text) {
        this.set("ok", text);
    }

    setWarning(text) {
        this.set("warning", text);
    }
}

class Template extends Card {
    constructor(id, label, text) {
        super("Template", label, templateTextToStringsAndWidgets(text, false), [
            new Action("offer", "New Offer", () => global.publisher.publish("dialog.show.offer", {id, label, text})),
        ]);
    }
}

class OfferDialog extends Card {
    constructor(id, label, text) {
        super("OfferDialog", label, templateTextToStringsAndWidgets(text, true), [
            new Action("submit", "Submit Offer", () => global.publisher.publish("offer.submit", this.getInput())),
            new Action("cancel", "Cancel", () => global.publisher.publish("dialog.hide")),
        ]);
    }
}

function templateTextToStringsAndWidgets(text, areEditable) {
    const result = [];
    let t0 = 0;
    let t1 = 0;
    const t2 = text.length;
    while (t1 < t2) {
        if (text.charAt(t1) === "{") {
            result.push(text.substring(t0, t1++));
            t0 = t1;
            while (t1 < t2) {
                if (text.charAt(t1) === "}") {
                    const name = text.substring(t0, t1++);
                    t0 = t1;
                    result.push(new InputField(name, name, null, areEditable));
                    break;
                }
                else {
                    t1++;
                }
            }
        }
        else {
            t1++;
        }
    }
    if (t0 < t2) {
        result.push(text.substring(t0, t2));
    }
    return result;
}

const co = {
    id: "component-order.txt",
    label: "Component Order",
    text: "" +
        "Final Assembly Plant Inc. hereby makes an order\n" +
        "for {quantity} units of \"{articleId}\" at the\n" +
        "unit price of {unitPrice} EUR from Component\n" +
        "Supplier Inc.\n" +
        "\n" +
        "The units are to be delivered by Carrier Inc.\n" +
        "to the Final Assembly Plant at {timeOfDelivery}.\n",
};

function main() {

    const root = new Widget(document.getElementById("root"));
    const modal = new Modal(document.getElementById("modal"));

    global.publisher.subscribe("dialog.hide", () => {
        modal.hide();
    });

    global.publisher.subscribe("dialog.show.offer", template => {
        modal.clearChildren();
        modal.addChild(new OfferDialog(template.id, template.label, template.text));
        modal.show();
    });

    global.publisher.subscribe("offer.submit", contract => {
        console.log(contract);
    });

    let card;

    const layoutTemplates = new Layout("templates", "Contract Templates", [
        new Template(co.id, co.label, co.text),
    ]);
    const layoutLog = new Layout("log", "Event Log", [
        card = new Card("offer", "Offer", [
            "Hello ",
            new InputField("name", "name", "Emanuel", true),
            "! How are ",
            new InputField("someone", "someone", "Sofia", true),
            " doing?",
        ], [
            new Action("x", "Submit", () => console.log(card.getInput())),
            new Action("y", "Reject", () => console.log("What!?")),
        ])
    ]);
    const layoutContracts = new Layout("contracts", "Contracts");

    root.addChildren(layoutTemplates, layoutLog, layoutContracts);

    setTimeout(() => {
        card.status.setError("Something bad is going on here!");
    }, 1000);
}
window.addEventListener("load", main);