"use strict";

class Publisher {
    constructor() {
        this.subscriptions = new Set();
    }

    publish(topic, data) {
        let isReceived = false;
        try {
            for (const [topic0, callback] of this.subscriptions) {
                if (topic === topic0) {
                    try {
                        isReceived = true;
                        callback(data);
                    }
                    catch (error) {
                        console.log("Failed to publish '" + topic + "' to one subscriber", error);
                    }
                }
            }
        }
        finally {
            if (!isReceived) {
                console.log("Event with topic '" + topic + "' and data (" +
                    data + ") not received by any subscriber");
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
    
    publish: (...args) => global.publisher.publish(...args),
    subscribe: (...args) => global.publisher.subscribe(...args),
    unsubscribe: (...args) => global.publisher.unsubscribe(...args),

    me: "plant",

    parties: [
        {
            name: "plant",
            label: "Final Assembly Plant"
        },
        {
            name: "carrier",
            label: "Carrier"
        },
        {
            name: "supplier",
            label: "Component Supplier"
        }
    ],

    templates: [
        {
            name: "component-order.txt",
            label: "Component Order",
            text: "" +
                "Final Assembly Plant Inc. hereby makes an order\n" +
                "for {quantity} units of \"{articleId}\" at the\n" +
                "unit price of {unitPrice} EUR from Component\n" +
                "Supplier Inc.\n" +
                "\n" +
                "The units are to be delivered by Carrier Inc.\n" +
                "to the Final Assembly Plant at {timeOfDelivery}.\n",
        },
    ],
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

    on(eventName, callback) {
        this.$element.addEventListener(eventName, callback);
        return { cancel: () => this.$element.removeEventListener(eventName, callback) };
    }
}

class Action extends Widget {
    constructor(className, label, callback) {
        super("a", {"class": "Action " + className}, [label]);
        this.on("click", () => {
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
    constructor(className, label, children = [], footer = []) {
        super("div", {"class": "Card " + className});
        this.head = new Widget("div", {"class": "Head"}, [label]);
        this.body = new Widget("div", {"class": "Body"}, children);        
        this.foot = new Widget("div", {"class": "Foot"}, [
            this.left = new Widget("div", {"class": "Left"}, footer),
            this.status = new Status("hidden"),
        ])
        this.addChildren(this.head, this.body, this.foot);
    }

    getInput() {
        const map = new Map();
        for (const nodeOrWidget of this.body) {
            if (nodeOrWidget instanceof InputField) {
                const value = nodeOrWidget.getValue();
                if ((value || "").trim().length === 0) {
                    nodeOrWidget.addClass("error");
                }
                else {
                    nodeOrWidget.removeClass("error");
                }
                map.set(nodeOrWidget.name, value);
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
        this.on("keypress", event => {
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
            this._focusin = this.on("focusin", () => {
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
            this._focusout = this.on("focusout", () => {
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
                this._focusin.cancel();
                delete this._focusin;
            }
            if (this._focusout) {
                this._focusout.cancel();
                delete this._focusout;   
            }
        }
        this.$element.setAttribute("contentEditable", isEditable ? "true" : "false");
    }
}

class InputSelector extends Widget {
    constructor(name, label, alternatives, selected = null) {
        super("select", {"class": "InputSelector " + name});
        this.$element.name = name;

        const options = [];
        for (let i = 0; i < alternatives.length; i++) {
            const alternative = alternatives[i];
            let widget = new Widget("option", {}, [alternative.label]);
            widget.$element.value = alternative.name;
            if (i === selected) {
                widget.$element.selected = "selected";
            }
            options.push(widget);
        }
        this.addChildren(options);
    }

    getValue() {
        return this.$element.value || "";
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
        if (this._delay > 0) {
            setTimeout(() => this.$element.style.display = "none", this._delay * 1000);
        }
        else {
            this.$element.style.display = value;
        }
    }

    show() {
        this.$element.style.display = this._display;
        setTimeout(() => this.addClass("visible"));
    }
}

class OfferDialog extends Card {
    constructor(id, label, text) {
        let receiver;
        const labelWithPartySelector = new Widget("span", {}, [
            "Offer ", new Widget("i", {}, [label]), " to ", receiver = new InputSelector(
                "receiver", "receiver", global.parties.filter(party => party.name !== global.me)
            )
        ]);
        super("OfferDialog", labelWithPartySelector, templateTextToStringsAndWidgets(text, {}, true), [
            new Action("submit", "Submit Offer", () => {
                const submission = this.validateAndCollectSubmission();
                if (submission) {
                    global.publish("offer.submit", submission);
                    global.publish("dialog.hide");
                }
            }),
            new Action("cancel", "Cancel", () => global.publish("dialog.hide")),
        ]);
        this.receiver = receiver;
    }

    validateAndCollectSubmission() {
        let hasError = false;

        const receiver = this.receiver.getValue();
        if (!receiver) {
            this.receiver.addClass("error");
            hasError = true;
        }
        const contract = this.getInput();
        for (const [key, value] of contract.entries()) {
            if ((value || "").trim().length === 0) {
                hasError = true;
            }
        }
        return hasError
            ? null
            : {receiver, contract};
    }
}

class Status extends Widget {
    constructor() {
        super("div", {"class": "Status hidden"});
        this.name = "hidden";
        this.on("click", () => this.setHidden());
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

class Contract extends Card {
    constructor(id, label, data, text, signatories) {
        super("Contract", label, templateTextToStringsAndWidgets(text, data, false), [
            new Widget("span", {"class": "Label"}, ["Signatories:"]),
            ...signatories.map(signatory => new Widget("span", {"class": "Signatory"}, [signatory]))]);
    }
}

class Template extends Card {
    constructor(id, label, text) {
        super("Template", label, templateTextToStringsAndWidgets(text, {}, false), [
            new Action("offer", "New Offer", () => global.publish("dialog.show.offer", {id, label, text})),
        ]);
    }
}

function templateTextToStringsAndWidgets(text, data = {}, areEditable = false) {
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

                    const value = data[name];
                    result.push(new InputField(name, name, value, areEditable));
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

function main() {

    const root = new Widget(document.getElementById("root"));
    const modal = new Modal(document.getElementById("modal"));

    global.subscribe("dialog.hide", () => {
        modal.hide();
    });

    global.subscribe("dialog.show.offer", template => {
        modal.clearChildren();
        modal.addChild(new OfferDialog(template.id, template.label, template.text));
        modal.show();
    });

    global.subscribe("offer.submit", contract => {
        console.log(contract);
    });

    let card;

    const layoutTemplates = new Layout("templates", "Contract Templates",
        global.templates.reduce((templates, template) => {
            templates.push(new Template(template.name, template.label, template.text));
            return templates;
        }, []));
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
    const layoutContracts = new Layout("contracts", "Contracts", [
        new Contract(global.templates[0].name, global.templates[0].label, {
            quantity: 10,
            articleId: "ABC-XYZ",
            unitPrice: 230,
            timeOfDelivery: "2020-10-31 14:30:05"
        }, global.templates[0].text, ["Assembly Plant Inc.", "Supplier Inc."]),
    ]);

    root.addChildren(layoutTemplates, layoutLog, layoutContracts);

    setTimeout(() => {
        card.status.setError("Something bad is going on here!");
    }, 1000);
}
window.addEventListener("load", main);