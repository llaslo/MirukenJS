var miruken = require('../lib/miruken.js'),
    context = require('../lib/context.js')
    chai    = require("chai"),
    expect  = chai.expect;

eval(base2.namespace);
eval(miruken.namespace);
eval(context.namespace);

describe("Context", function() {
    var Dog = Base.extend({});
    
    describe("#getState", function() {
        it("should start in the default state", function() {
            var context = new Context;
            expect(context.getState()).to.equal(ContextState.Active);
            expect(context.state).to.equal(context.getState());
            expect(context.getChildren()).to.be.empty;
        });
    });
    
    describe("#getParent", function() {
        it("should not have a parent when root", function() {
            var context = new Context;
            expect(context.getParent()).to.not.exist;
            expect(context.parent).to.equal(context.getParent());
        });
        
        it("should have a parent when a child", function() {
            var context = new Context,
            child   = context.newChild();
            expect(child.parent).to.equal(context);
        });
    });
    
    describe("#getChildren", function() {
        it("should have children when created", function() {
            var context = new Context,
                child1  = context.newChild(),
                child2  = context.newChild();
            expect(context.getChildren()).to.include(child1, child2);
            expect(context.children).to.eql(context.getChildren());
        });
    });
    
    describe("#hasChildren", function() {
        it("should not have children by default", function() {
            var context = new Context;
            expect(context.hasChildren()).to.be.false;
        });
        
        it("should have children when created", function() {
            var context = new Context,
                child   = context.newChild();
            expect(context.hasChildren()).to.be.true;
        });
    });
    
    describe("#getRoot", function() {
        it("should return self if no childern", function() {
            var context = new Context;
            expect(context.getRoot()).to.equal(context);
        });
        
        it("should return root context when descendant", function() {
            var context    = new Context,
                child      = context.newChild(),
                grandChild = child.newChild();
            expect(grandChild.getRoot()).to.equal(context);
        });
    });

    describe("#newChild", function() {
        it("should return new child context", function() {
            var context      = new Context,
                childContext = context.newChild();
            expect(childContext.parent).to.equal(context);
        });

        it("should execute block with new child context and then end it", function() {
            var context      = new Context,
                childContext = context.newChild();
            $using(
                childContext, function (ctx) {
                    expect(ctx.state).to.equal(ContextState.Active);
                    expect(ctx.parent).to.equal(context); }
            );
            expect(childContext.state).to.equal(ContextState.Ended);
        });
    });

    describe("#resolve", function() {
        it("should resolve context to self", function() {
            var context = new Context;
            expect(context.resolve(Context)).to.equal(context);
        });
        
        it("should return root context when descendant", function() {
            var context    = new Context,
                child      = context.newChild(),
                grandChild = child.newChild();
            expect(grandChild.getRoot()).to.equal(context);
        });
    });
    
    describe("#end", function() {
        it("should end the context", function() {
            var context = new Context;
            context.end();
            expect(context.state).to.equal(ContextState.Ended);
        });
        
        it("should end children", function() {
            var context = new Context,
                child   = context.newChild();
            context.end();
            expect(context.state).to.equal(ContextState.Ended);
            expect(child.state).to.equal(ContextState.Ended);
        });
    });

    describe("#dispose", function() {
        it("should end the context", function() {
            var context = new Context;
            context.dispose();
            expect(context.state).to.equal(ContextState.Ended);
        });
    });
    
    describe("#unwind", function() {
        it("should end children when ended", function() {
            var context = new Context,
                child1  = context.newChild(),
                child2  = context.newChild();
            context.unwind();
            expect(context.state).to.equal(ContextState.Active);
            expect(child1.state).to.equal(ContextState.Ended);
            expect(child2.state).to.equal(ContextState.Ended);
        });
    });

    describe("#unwindToRootContext", function() {
        it("should end children except and root and return it", function() {
            var context    = new Context,
                child1     = context.newChild(),
                child2     = context.newChild(),
                grandChild = child1.newChild();
            var root       = context.unwindToRootContext();
            expect(root).to.equal(context);
            expect(context.state).to.equal(ContextState.Active);
            expect(child1.state).to.equal(ContextState.Ended);
            expect(child2.state).to.equal(ContextState.Ended);
            expect(grandChild.state).to.equal(ContextState.Ended);
        });
    });

    describe("#store", function() {
        it("should add object to the context", function() {
            var dog     = new Dog,
                context = new Context;
            expect(context.resolve(Dog)).to.be.undefined;
            context.store(dog);
            expect(context.resolve(Dog)).to.equal(dog);
        });
    });

    describe("#handle", function() {
        it("should traverse ancestors", function() {
            var dog        = new Dog,
                context    = new Context,
                child1     = context.newChild(),
                child2     = context.newChild(),
                grandChild = child1.newChild();
            context.store(dog);
            expect(grandChild.resolve(Dog)).to.equal(dog);
        });
    });

    describe("#handleAxis", function() {
        it("should wrap context", function() {
            var dog       = new Dog,
                context   = new Context,
                wrapped   = context.$self(),
                decorated = wrapped.when(function(cb) { return true; });
            context.store(dog);
            expect(wrapped).to.not.equal(context);
            expect(wrapped.constructor).to.equal(Context);
            expect(wrapped.addHandlers(dog)).to.equal(wrapped);
            expect(decorated.decoratee).to.equal(wrapped);
            expect(context.resolve(Dog)).to.equal(dog);
        });

        it("should traverse self", function() {
            var dog     = new Dog,
                context = new Context,
                child   = context.newChild();
            context.store(dog);
            expect(child.$self().resolve(Dog)).to.be.undefined;
            expect(context.$self().resolve(Dog)).to.equal(dog);
        });

        it("should traverse root", function() {
            var dog   = new Dog,
                root  = new Context,
                child = root.newChild();
            child.store(dog);
            expect(child.$root().resolve(Dog)).to.be.undefined;
            root.store(dog);
            expect(child.$root().resolve(Dog)).to.equal(dog);
        });

        it("should traverse children", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child2.store(dog);
            expect(child2.$child().resolve(Dog)).to.be.undefined;
            expect(grandChild.$child().resolve(Dog)).to.be.undefined;
            expect(root.$child().resolve(Dog)).to.equal(dog);
        });

        it("should traverse siblings", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child3.store(dog);
            expect(root.$sibling().resolve(Dog)).to.be.undefined;
            expect(child3.$sibling().resolve(Dog)).to.be.undefined;
            expect(grandChild.$sibling().resolve(Dog)).to.be.undefined;
            expect(child2.$sibling().resolve(Dog)).to.equal(dog);
        });

        it("should traverse children and self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child3.store(dog);
            expect(child1.$childOrSelf().resolve(Dog)).to.be.undefined;
            expect(grandChild.$childOrSelf().resolve(Dog)).to.be.undefined;
            expect(child3.$childOrSelf().resolve(Dog)).to.equal(dog);
            expect(root.$childOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse siblings and self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child3.store(dog);
            expect(root.$siblingOrSelf().resolve(Dog)).to.be.undefined;
            expect(grandChild.$siblingOrSelf().resolve(Dog)).to.be.undefined;
            expect(child3.$siblingOrSelf().resolve(Dog)).to.equal(dog);
            expect(child2.$siblingOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse ancestors", function() {
            var dog        = new Dog,
                root       = new Context,
                child      = root.newChild(),
                grandChild = child.newChild();
            root.store(dog);
            expect(root.$ancestor().resolve(Dog)).to.be.undefined;
            expect(grandChild.$ancestor().resolve(Dog)).to.equal(dog);
        });

        it("should traverse ancestors or self", function() {
            var dog        = new Dog,
                root       = new Context,
                child      = root.newChild(),
                grandChild = child.newChild();
            root.store(dog);
            expect(root.$ancestorOrSelf().resolve(Dog)).to.equal(dog);
            expect(grandChild.$ancestorOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse descendants", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            grandChild.store(dog);
            expect(grandChild.$descendant().resolve(Dog)).to.be.undefined;
            expect(child2.$descendant().resolve(Dog)).to.be.undefined;
            expect(child3.$descendant().resolve(Dog)).to.equal(dog);
            expect(root.$descendant().resolve(Dog)).to.equal(dog);
        });

        it("should traverse descendants or self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            grandChild.store(dog);
            expect(child2.$descendantOrSelf().resolve(Dog)).to.be.undefined;
            expect(grandChild.$descendantOrSelf().resolve(Dog)).to.equal(dog);
            expect(child3.$descendantOrSelf().resolve(Dog)).to.equal(dog);
            expect(root.$descendantOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse ancestot, siblings or |self|", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            root.store(dog);
            expect(child2.$descendantOrSelf().resolve(Dog)).to.be.undefined;
            expect(root.$ancestorSiblingOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse ancestor, |siblings| or self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child2.store(dog);
            expect(grandChild.$descendantOrSelf().resolve(Dog)).to.be.undefined;
            expect(child3.$ancestorSiblingOrSelf().resolve(Dog)).to.equal(dog);
        });

        it("should traverse |ancestor|, siblings or self", function() {
            var dog        = new Dog,
                root       = new Context,
                child1     = root.newChild(),
                child2     = root.newChild(),
                child3     = root.newChild(),
                grandChild = child3.newChild();
            child3.store(dog);
            expect(grandChild.$ancestorSiblingOrSelf().resolve(Dog)).to.equal(dog);
        });
    });

    describe("#observe", function() {
        it("should observe context end", function() {
            var context = new Context,
                ending  = false, ended = false;
            context.observe({
                contextEnding: function(ctx) { 
                    expect(ctx).to.equal(context);
                    ending = !ended; 
                },
                contextEnded:  function(ctx) {
                    expect(ctx).to.equal(context);
                    ended  = true; 
                }
            });
            context.end();
            expect(ending).to.be.true;
            expect(ended).to.be.true;
        });
    });

    describe("#observe", function() {
        it("should observe child context end", function() {
            var context = new Context,
                child   = context.newChild(),
                ending  = false, ended = false;
            context.observe({
                childContextEnding: function(ctx) {
                    expect(ctx).to.equal(child);
                    ending = !ended;
                },
                childContextEnded:  function(ctx) {
                    expect(ctx).to.equal(child);
                    ended  = true; 
                }
            });
            child.end();
            expect(ending).to.be.true;
            expect(ended).to.be.true;
        });
    });

    describe("#observe", function() {
        it("can un-observe context end", function() {
            var context = new Context,
                ending  = false, ended = false;
            var unobserve = context.observe({
                contextEnding: function(ctx) { 
                    expect(ctx).to.equal(context);
                    ending = !ended; 
                },
                contextEnded:  function(ctx) {
                    expect(ctx).to.equal(context);
                    ended  = true; 
                }
            });
            unobserve();
            context.end();
            expect(ending).to.be.false;
            expect(ended).to.be.false;
        });
    });
});

describe("Contextual", function() {
    var Shutdown = Base.extend({
        constructor: function(methodName, args) {
            var _vetos = [];
            this.extend({
                getVetos: function() { 
                    return _vetos.slice(0); 
                },
                veto: function(reason) {
                    _vetos.puh(reason);
                }
            });
        }
    });
    
    var Controller = Base.extend($contextual, {
        shutdown: function(shutdown) {}
    });

    describe("#setContext", function() {
        it("should be able to set context", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);    
            expect(controller.getContext()).to.equal(context);
        });

        it("should add handler when context set", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);    
            var resolve    = context.resolve(Controller);
            expect(resolve).to.equal(controller);
        });

        it("should remove handler when context cleared", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);    
            var resolve    = context.resolve(Controller);
            expect(resolve).to.equal(controller);
            controller.setContext(null);
            expect(context.resolve(Controller)).to.be.undefined;
        });
    });

    describe("#isActiveContext", function() {
        it("should be able to test if context active", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);
            expect(controller.isActiveContext()).to.be.true;
        });
    });

    describe("#endContext", function() {
        it("should be able to end context", function() {
            var context    = new Context,
                controller = new Controller;
            controller.setContext(context);
            controller.endContext();
            expect(context.state).to.equal(ContextState.Ended);
            expect(controller.isActiveContext()).to.be.false;
        });
    });
});
