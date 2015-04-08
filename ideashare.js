// create a collection
Ideas = new Meteor.Collection('ideas');

if (Meteor.isClient) {

    Meteor.subscribe('ideas');

    Template.likeGraphVisual.rendered = function() {
        var svg,
            width = 20,
            height = 10,
            x;

        svg = d3.select('.likeGraph').append('svg')
            .attr('width', width)
            .attr('height', height);

        var drawIdeas = function(update) {
            var likes = Ideas.findOne().likes;
            var ideas = svg.selectAll('ideas').data(likes);
            if (!update) {
                ideas = ideas.enter().append('ideas')
                    .attr('cx', function(d, i) {
                        return x(i);
                    })
                    .attr('cy', height / 2);
            } else {
                ideas = ideas.transition().duration(1000);
            }
            ideas.attr('r', function(d) {
                return d;
            });
        };

        Ideas.find().observe({
            added: function() {
                x = d3.scale.ordinal()
                    .domain(d3.range(Ideas.findOne().likes.length))
                    .rangePoints([0, width], 1);
                drawIdeas(false);
            },
            changed: _.partial(drawIdeas, true)
        });
    };

    // this is loop it the number of items in this array
    Template.body.helpers({
        'popularIdeas': function() {
            return Ideas.find({}, {
                sort: {
                    likes: -1,
                    date: -1
                }
            });
        },
        'ideaCount': function() {
            return Ideas.find().count();
        }
    });

    // for events
    Template.header.events({
        'submit form.ideaForm': function(e) {
            e.preventDefault();

            var title = e.target.ideaTitle.value;
            var body = e.target.ideaBody.value;

            Meteor.call('insertIdea', title, body);
        },
        'click .reset': function() {
            Meteor.call('reset');
        }
    });

    Template.card.events({
        'click .inc': function() {
            Meteor.call('voteUp', this._id, 1);
        },
        'click .dec': function() {
            Meteor.call('voteUp', this._id, -1);
        }
    });
}

if (Meteor.isServer) {
    Meteor.publish('ideas', function() {
        return Ideas.find({});
    });

    Meteor.methods({
        reset: function() {
            Ideas.remove({});
        },
        insertIdea: function(ideaTitle, ideaBody) {
            Ideas.insert({
                title: ideaTitle,
                body: ideaBody,
                date: new Date(),
                likes: 1
            });
        },
        voteUp: function(selectedCard, ideaScore) {
            Ideas.update({
                _id: selectedCard
            }, {
                $inc: {
                    likes: ideaScore
                }
            });
        }
    });
}
