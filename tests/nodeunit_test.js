"use strict";
var assert = require("assert"); 
var Pipeline = require('../src/pipeline.js');

module.exports = { 

    'test start actions' : function(test) { 
        test.expect(3);
        var number = 0;
        
        var pipeline = Pipeline().start(function() {
            test.equal(number++, 0, 'did not run first');
        }).startAsync(function(cb) {
            test.equal(number++, 1, 'did not run second');
            setTimeout(cb, 10);
        }).start(function() {
           test.equal(number++, 2, 'did not run third');
           test.done();
        }).create();
        pipeline({count: 0, item: 0});
        pipeline({count: 0, item: 1});
    },
    
    'test stop actions': function(test) {
        test.expect(3);
        var number = 0;
        
        var pipeline = Pipeline().stop(function() {
            test.equal(number++, 0, 'did not run first');
        }).stopAsync(function(cb) {
            test.equal(number++, 1, 'did not run second');
            setTimeout(cb, 10);
        }).stop(function() {
           test.equal(number++, 2, 'did not run third');
           test.done();
        }).create();
        pipeline({count: 0, item: 0});
        pipeline({count: 0, item: 1});
    },
    
    'test pipe actions': function(test) {
        test.expect(12);
        var inum = 0;
        
        var pipeline = Pipeline().pipe(function(item) {
            test.equal(inum, item.item, 'was wrong item');
            test.equal(item.count++, 0, 'did not run first');
        }).pipeAsync(function(item, cb) {
            test.equal(inum, item.item, 'was wrong item');
            test.equal(item.count++, 1, 'did not run second');
            setTimeout(cb, 10);
        }).pipe(function(item) {
            test.equal(inum++, item.item, 'was wrong item');
            test.equal(item.count++, 2, 'did not run third');
            
            if(inum == 2) test.done();
        }).create();
        pipeline({count: 0, item: 0});
        pipeline({count: 0, item: 1});
    },
    
    'test once actions': function(test) {
        test.expect(3);
        var number = 0;
        
        var pipeline = Pipeline().pipeAsync(function(item, cb) {
            setTimeout(cb, 30);
            number++;
        }).create();
        
        pipeline.once(function() {
           //test.ok(number++ == 0, number.toString());
           test.equal(number++, 0, 'did not run first'); 
        });
        setTimeout(function() {
            pipeline({count: 0, item: 0});
            pipeline({count: 0, item: 1});
            pipeline.once(function() {
                test.equal(number++, 3, 'did not run second'); 
            });
            pipeline.once(function() {
                test.equal(number++, 4, 'did not run third');
                test.done();
            });
        }, 10);
    },
    
    'test complex': function(test) {
        test.expect(19);
        var number = 0;
        var inum = 0;
        
        var pipeline = Pipeline().start(function() {
            test.equal(number++, 0, 'did not run first');
        }).startAsync(function(cb) {
            test.equal(number++, 1, 'did not run second');
            setTimeout(cb, 10);
        }).start(function() {
           test.equal(number++, 2, 'did not run third');
        }).pipe(function(item) {
            test.equal(inum, item.item, 'was wrong item');
            test.equal(item.count++, 0, 'did not run first');
            number++;
        }).pipeAsync(function(item, cb) {
            test.equal(inum, item.item, 'was wrong item');
            test.equal(item.count++, 1, 'did not run second');
            setTimeout(cb, 10);
        }).pipe(function(item) {
            test.equal(inum++, item.item, 'was wrong item');
            test.equal(item.count++, 2, 'did not run third');
        }).stop(function() {
            test.equal(number++, 5, 'did not run first');
        }).stopAsync(function(cb) {
            test.equal(number++, 6, 'did not run second');
            setTimeout(cb, 10);
        }).stop(function() {
           test.equal(number++, 7, 'did not run third');
        }).create();
        pipeline({count: 0, item: 0});
        pipeline({count: 0, item: 1});
        pipeline.once(function() {
           test.equal(number++, 8, 'did not run last');
           test.done();
        });
    },
    
    'test skipping': function(test) {
        test.expect(1);
        var number = 0;
        
        var pipeline = Pipeline().pipe(function() {
            this.skip();
            this.skip(); // double to test that it still works
            number++;
        }).pipe(function() {
            number++;
        }).stop(function() {
            test.equal(number, 1, 'did not skip');
            test.done();
        }).create();
        
        pipeline({count: 0, item: 0});
    },
    
    'test redo': function(test) {
        test.expect(1);
        var number = 0;
        
        var pipeline = Pipeline().pipe(function() {
            if(number === 0) { this.redo(); this.redo(); } //double to test that it still works
            number++;
        }).stop(function() {
            test.equal(number, 2, 'did not skip');
            test.done();
        }).create();
        
        pipeline({count: 0, item: 0});
    },
    
    'test backlog': function(test) {
        test.expect(3);
        
        var pipeline = Pipeline().pipe(function(item) {
            // do nothing
        }).pipeAsync(function(item, cb) {
            // do nothing
            setTimeout(cb, 10);
        }).pipe(function(item) {
            // do nothing
        }).create();
        
        test.equal(pipeline.backlog(), 0, 'not empty');
        pipeline({count: 0, item: 0});
        pipeline({count: 0, item: 1});
        test.equal(pipeline.backlog(), 2, 'not containing 2 item');
        setTimeout(function() {
            test.equal(pipeline.backlog(), 1, 'not containing 1 item');
            test.done();
        }, 1);
    }
}; 

if (typeof module !== "undefined" && module === require.main) {
    process.chdir('tests');
    require('nodeunit').reporters.default.run(['pipeline_test.js']);
}