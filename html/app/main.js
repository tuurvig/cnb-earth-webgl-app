require.config({
    baseUrl: 'app',
    paths: {
        text: "lib/require/text",
        image: "lib/require/image",
        json: "lib/require/json",
        glMatrix: "lib/gl-matrix-min",
        WebGLCore: "web-gl-core",
        Mesh: "model/mesh",
        Model: "model/model",
        Actor: "model/actor",
        GameObject: "model/game-object",
        Earth: "earth",
        Pointer: "pointer",
        Trackball: "utils/trackball",
        InteractableEarth: "interactable-earth",
        constants: "constants",
    }
});

// load data about institutions before everything else
define(['json!../../Content/groups.json'], function(groups) {
    'use strict';

    const LANGUAGE = {
        CZECH: "cz",
        ENGLISH: "en"
    }

    const Runtime = {
        App: null,
        renderContainer: document.getElementById("earth-render-container"),
        earthRenderer: document.getElementById("earth-renderer"),
        textRenderer: document.getElementById("text-renderer"),
        groupDetailElem: document.getElementById("group-detail-container"),
        groupMenuElem: document.getElementById("group-menu"),
        mapOverlayElem: document.getElementById("map-overlay"),
        buttonsMenu: document.getElementById("map-overlay-buttons"),
        langHTML: {
            cz: {
                "menu-label": "Vyberte si instituci z nabídky:",
                "name-label": "Název organizace",
                "members-label": "Počet členů:",
                "year-label": "Rok založení:",
                "residence-label": "Sídlo:",
                "authority-label": "Název centrálního orgánu:"
            },
            en: {
                "menu-label": "Select an institution from the menu:",
                "name-label": "Organization name:",
                "members-label": "Number of members:",
                "year-label": "Year of foundation:",
                "residence-label": "Residence:",
                "authority-label": "Central authority:"
            }
        },
        groups: groups,
        activeGroup: 0,
        activeLanguage: LANGUAGE.CZECH,
        buttonsMenuHidden: false,
        hideTimeout: null,
        render: false,
        lockInteraction: false,
        animationFrameRequest: null,
        activeTouchId: null,
        defaultTimeout: null,
        infoTimeout: null,

        Setup: function() {
            this.SetupButtons();
            this.SetupGroups();
        },

        SetupContext: function(app) {
            let context =
                this.earthRenderer.getContext('webgl2') ||
                this.earthRenderer.getContext('experimental-webgl2');

            let self = this;

            if (!context) {
                alert('Your browser does not support WebGL2');
                return undefined;
            } else {
                self.App = app;
                return context;
            }
        },

        SetupRenderApp: function() {
            this.App.Init();
            this.UpdateRenderCanvas();
            this.App.SetupTextRenderer(this.textRenderer);
            this.App.Setup();
            this.LoadGroupTextures();
            this.App.SwitchToGroup(this.groups[this.activeGroup]);
            this.App.SwitchLanguage(this.activeLanguage);
            this.App.UpdateCurrentTime();

            this.SetEvents();
        },

        LoadGroupTextures: function() {
            let app = this.App;
            this.groups.forEach(group => {
                group.texture = app.GetOverlayTextureFromPath("img/groups/" + group.shortcut + ".png");
            });
        },

        MainLoop: function() {
            let self = this;
            this.animationFrameRequest = window.requestAnimationFrame(function(time) {
                self.App.Timer(time);
                self.App.Render();
                self.MainLoop();
            });
        },

        RenderFrame: function() {
            let self = this;
            this.DeactivateRender();
            this.animationFrameRequest = window.requestAnimationFrame(function(time) {
                self.App.Timer(time);
                self.App.Render();
            });
        },

        ActivateRender: function() {
            this.App.UpdateCurrentTime();
            // clear the existing request if any
	    clearTimeout(this.hideTimeout);
            this.DeactivateRender();

            this.MainLoop();
        },

        DeactivateRender: function() {
            window.cancelAnimationFrame(this.animationFrameRequest);
        },

        UpdateRenderCanvas: function() {
            //let width = window.innerWidth*0.75;
            //let height = window.innerHeight*0.75;
            let width = window.innerWidth;
            let height = window.innerHeight;
            if (width > height) width = height;
            else height = width;

            this.earthRenderer.width = width;
            this.earthRenderer.height = height;
            this.textRenderer.width = width;
            this.textRenderer.height = height;
            this.App.SetWindow(width, height);
        },

        CreateGroupMenuButton: function(group) {
            let div = document.createElement("div");
            let divInner = document.createElement("div");
            let divBG = document.createElement("div");
            let section = document.createElement("section");
            let strong = document.createElement("strong");
            let p = document.createElement("p");

            section.appendChild(strong);
            section.appendChild(p);

            strong.innerHTML = group.lang[this.activeLanguage].shortcut || group.shortcut;
            p.innerHTML = group.lang[this.activeLanguage].name;
            divInner.appendChild(divBG);
            divInner.appendChild(section);
            div.id = group.shortcut;
            div.appendChild(divInner);

            const random = Math.random() * 360;
            divBG.style.transform = `rotate(${random}deg)`;

            return div;
        },

        SetupGroups: function() {
            let container = document.getElementById("group-items-container");
            const len = this.groups.length;
            let self = this;
            let selectedClass = "group-selected";

            for (let i = 0; i < len; i++) {
                (index => {
                    const group = self.groups[index];
                    // group.texture = self.App.GetOverlayTextureFromPath("img/groups/" + group.shortcut + ".png");
                    const groupBtn = self.CreateGroupMenuButton(group);

                    groupBtn.onclick = e => {
                        const selected = document.getElementsByClassName(selectedClass)[0];
                        selected.classList.remove(selectedClass);
                        groupBtn.classList.add(selectedClass);

                        self.MakeGroupActive(index);
                        this.App.SwitchToGroup(group);
                        self.UpdateDetailWindow(group);
                        self.UpdateTitle(group);

                        self.ShowMap();
                    }

                    container.appendChild(groupBtn);
                })(i);
            }

            this.MakeGroupActive(0);
            const activeGroup = this.groups[this.activeGroup];

            let firstDiv = container.children[0];
            firstDiv.classList.add(selectedClass);
            this.UpdateTitle(activeGroup);
            this.UpdateDetailWindow(activeGroup);

            const padbox1 = document.createElement("span");
            padbox1.classList.add("group-items-padbox");
            const padbox2 = padbox1.cloneNode();
            container.appendChild(padbox2);
            //container.insertBefore(padbox1, firstDiv);
        },

        ShowMap: function() {
            this.groupMenuElem.classList.add("hidden");
            this.mapOverlayElem.classList.remove("hidden");

            if (this.groupDetailElem.classList.contains("detailHidden")) {
                this.lockInteraction = false;
            }

            this.App.RotateToDefault();
            this.RenderFrame();
        },

        MakeGroupActive: function(index) {
            this.activeGroup = index % this.groups.length;
        },

        SetupButtons: function() {
            const groupItemsCont = document.getElementById("group-items-container");
            const menuMap = document.getElementById("menu-map");
            const mapDetail = document.getElementById("map-detail");
            const mapMenu = document.getElementById("map-menu");
            const namesToggle = document.getElementById("show-names");
            const detailClose = document.getElementById("detail-close");

            const langCZ = document.getElementById("lang-cz");
            const langEN = document.getElementById("lang-en");

            let self = this;

            menuMap.onclick = function(e) {
                self.ShowMap();
            }

            mapMenu.onclick = function(e) {
                self.groupMenuElem.classList.remove("hidden");
                self.mapOverlayElem.classList.add("hidden");

                self.DeactivateRender();
                self.ClearDefaultTimeout();
                self.ClearInfoTimeout();

                groupItemsCont.scrollTop = 0;
            }

            mapDetail.onclick = function(e) {
                self.groupDetailElem.classList.toggle("detailHidden");
                self.lockInteraction = !self.lockInteraction;
                if(self.lockInteraction){
                    self.InfoTimeout();
                }
                else{
                    self.ClearInfoTimeout();
                }
            }

            namesToggle.onclick = function(e) {
                if (self.App.ToggleNames()) {
                    namesToggle.classList.remove("names-inactive");
                    namesToggle.classList.add("names-active");
                } else {
                    namesToggle.classList.add("names-inactive");
                    namesToggle.classList.remove("names-active");
                }
                self.RenderFrame();
            }

            detailClose.onclick = function(e) {
                self.groupDetailElem.classList.add("detailHidden");
                self.lockInteraction = false;
            }

            langCZ.onclick = function(e) {
                if (self.activeLanguage === LANGUAGE.CZECH) return;
                const group = self.groups[self.activeGroup];
                self.ChangeLanguage(LANGUAGE.CZECH);
                self.UpdateTitle(group);
                self.UpdateDetailWindow(group);
                self.UpdateMenuButtons();
                self.App.SwitchLanguage(LANGUAGE.CZECH);
            }

            langEN.onclick = function(e) {
                if (self.activeLanguage === LANGUAGE.ENGLISH) return;
                const group = self.groups[self.activeGroup];
                self.ChangeLanguage(LANGUAGE.ENGLISH);
                self.UpdateTitle(group);
                self.UpdateDetailWindow(group);
                self.UpdateMenuButtons();
                self.App.SwitchLanguage(LANGUAGE.ENGLISH);
            }
        },

        ChangeLanguage: function(lang) {
            this.activeLanguage = lang;

            for (const [key, value] of Object.entries(this.langHTML[this.activeLanguage])) {
                const elem = document.getElementById(key);
                elem.innerHTML = value;
            }
        },

        UpdateTitle: function(group) {
            const titleShort = this.mapOverlayElem.querySelector("h1");
            const title = this.mapOverlayElem.querySelector("h2");
            titleShort.innerHTML = group.lang[this.activeLanguage].shortcut || group.shortcut;
            title.innerHTML = group.lang[this.activeLanguage].name;
        },

        UpdateDetailWindow: function(group) {
            const groupLang = group.lang[this.activeLanguage];

            const name = document.getElementById("name-value");

            const members = document.getElementById("members-value");
            const membersDetail = document.getElementById("members-detail");
            const year = document.getElementById("year-value");
            const yearDetail = document.getElementById("year-detail");
            const residence = document.getElementById("residence-value");
            const residenceDetail = document.getElementById("residence-detail");
            const authority = document.getElementById("authority-value");
            const authorityDetail = document.getElementById("authority-detail");
            const description = document.getElementById("group-detail-description");

            const descr = groupLang.description;

            name.innerHTML = groupLang.name;
            members.innerHTML = groupLang.numberOfMembers;
            membersDetail.innerHTML = groupLang.numberOfMembersDetail || "";
            year.innerHTML = groupLang.year;
            yearDetail.innerHTML = groupLang.yearDetail || "";
            residence.innerHTML = groupLang.residence;
            residenceDetail.innerHTML = groupLang.residenceDetail || "";
            authority.innerHTML = groupLang.authorityName;
            authorityDetail.innerHTML = groupLang.authorityNameDetail || "";

            description.innerHTML = '';

            descr.forEach(function(paragraph) {
                let p = document.createElement("p");
                p.innerHTML = paragraph;
                description.appendChild(p);
            });
        },

        UpdateMenuButtons: function() {
            const self = this;

            this.groups.forEach(group => {
                const groupBtn = document.getElementById(group.shortcut);
                const p = groupBtn.querySelector("p");
                const strong = groupBtn.querySelector("strong");
                p.innerHTML = group.lang[self.activeLanguage].name;
                strong.innerHTML = group.lang[this.activeLanguage].shortcut || group.shortcut;
            });
        },

        SetEvents: function() {
            let self = this;

            window.addEventListener("resize", function() {
                self.UpdateRenderCanvas();
                self.App.ResizeUpdate();
                self.RenderFrame();
            });

            require(['Mouse'], function(Mouse) {
                self.renderContainer.addEventListener("mousedown", function(e) {
                    const button = e.button;
                    if (!Mouse.ButtonMap[button] && !self.lockInteraction) {
                        Mouse.SetButtonPressed(button);
                        Mouse.SetOriginPosition(e.offsetX, e.offsetY);
                        self.App.MouseClick();
                        self.ActivateRender();
                        self.ClearDefaultTimeout();
                        //self.HideMapButtons();
                    }
                });

                self.mapOverlayElem.addEventListener("mouseup", function(e) {
                    if (self.lockInteraction) return;
                    Mouse.SetButtonReleased(e.button);
		            self.TimeoutDeactivate();
                    self.DefaultTimeout();
                    //self.ShowMapButtons();
                });

                const GetOffsetPosition = function(elem, clientX, clientY) {
                    const rect = elem.getBoundingClientRect();
                    return [clientX - rect.left, clientY - rect.top];
                }

                self.renderContainer.addEventListener("touchstart", function(e) {
                    const touches = e.touches;
                    if (touches.length > 1 || self.lockInteraction) return;

                    const touch = touches[0];
                    const [offsetX, offsetY] = GetOffsetPosition(self.renderContainer, touch.clientX, touch.clientY);
                    self.activeTouchId = touch.identifier;
                    Mouse.SetButtonPressed(0);
                    Mouse.SetOriginPosition(offsetX, offsetY);
                    self.App.MouseClick();
                    self.ActivateRender();
                    self.ClearDefaultTimeout();
                    //self.HideMapButtons();
                });

                document.addEventListener("touchend", function(e) {
                    if (self.lockInteraction || self.activeTouchId === null) return;

                    const endedTouches = e.changedTouches;
                    for (let i = 0; i < endedTouches.length; i++) {
                        if (endedTouches[i].identifier === self.activeTouchId) {
                            Mouse.SetButtonReleased(0);
                            self.activeTouchId = null;
			    self.TimeoutDeactivate();
                            self.DefaultTimeout();
                            //self.ShowMapButtons();
                        }
                    }
                });

                self.mapOverlayElem.addEventListener("mousemove", function(e) {
                    Mouse.RegisterPosition(e.offsetX, e.offsetY);
                });

                self.mapOverlayElem.addEventListener("touchmove", function(e) {
                    if (self.lockInteraction || self.activeTouchId === null) return;
                    const changedTouches = e.changedTouches;
                    let touch = null;

                    for (let i = 0; i < changedTouches.length; i++) {
                        touch = changedTouches[i];
                        if (touch.identifier === self.activeTouchId) {
                            const [offsetX, offsetY] = GetOffsetPosition(self.mapOverlayElem, touch.clientX, touch.clientY);
                            Mouse.RegisterPosition(offsetX, offsetY);
                        }
                    }
                });

                self.mapOverlayElem.addEventListener("mouseout", function() {
                    if (Mouse.IsLeftPressed() && !self.lockInteraction) {
                        Mouse.SetButtonReleased(0);
			self.TimeoutDeactivate();
                        self.DefaultTimeout();
                        //self.ShowMapButtons();
                    }
                });

                self.mapOverlayElem.addEventListener("touchcancel", function() {
                    if (Mouse.IsLeftPressed() && !self.lockInteraction) {
                        self.activeTouchId = null;
                        Mouse.SetButtonReleased(0);
			self.TimeoutDeactivate();
                        self.DefaultTimeout();
                        //self.ShowMapButtons();
                    }
                });
            });
        },

        HideMapButtons: function() {
            if (this.buttonsMenuHidden) {
                clearTimeout(this.hideTimeout);
                return;
            }

            this.buttonsMenu.classList.add("hiddenMenu");
            this.buttonsMenuHidden = true;
        },

        TimeoutDeactivate: function() {
	    clearTimeout(this.hideTimeout);
	    const self = this;
            this.hideTimeout = setTimeout(function() {
                self.DeactivateRender();
            }, 1000);	    
	    },

        DefaultTimeout: function(){
            clearTimeout(this.defaultTimeout);
	    const self = this;
            this.defaultTimeout = setTimeout(function(){
                self.App.RotateToDefault();
                self.RenderFrame();
            }, 30000);
        },
        ClearDefaultTimeout: function(){
            clearTimeout(this.defaultTimeout);
        },
        InfoTimeout: function(){
            clearTimeout(this.infoTimeout);
	    const self = this;
            this.infoTimeout = setTimeout(function(){
                self.App.RotateToDefault();
                self.RenderFrame();
            }, 180000);
        },
        ClearInfoTimeout: function(){
            clearTimeout(this.infoTimeout);
        },
	ShowMapButtons: function() {
           let self = this;
           if (!self.buttonsMenuHidden) return;
           clearTimeout(this.hideTimeout);
               this.hideTimeout = setTimeout(function() {
               self.buttonsMenu.classList.remove("hiddenMenu");
               self.buttonsMenuHidden = false;
               self.DeactivateRender();
           }, 1000);
       }
    }

    // load program with rotating earth
    require(['InteractableEarth'], function(earth) {
        // setup the non-webgl part of a web page
        Runtime.Setup();

        // create webgl2 context from canvas element and inititalize new instance of earth
        let ctx = Runtime.SetupContext(new earth.app())
        if (!ctx) return;

        // upload webgl2 context to a private variable of the earth app
        earth.UploadContext(ctx);
        
        // setup newly created earth app
        Runtime.SetupRenderApp();

        setTimeout(function() {
            document.getElementById("load-screen").classList.add("hidden");
        }, 3000);
    });
});