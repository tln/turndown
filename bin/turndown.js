#!/usr/bin/env node
var fs = require('fs')
var program = require('commander')
var TurndownService = require('../lib/turndown.cjs.js')

program
  .version(require('../package.json').version)
  .usage('(<input> | --input <input>) [options]')
  .option('-m --move', 'Remove input file, create .md output file')
  .option('--yaml', 'Ignore YAML frontmatter')
  .option('-i, --input <input>', 'string of HTML or HTML file to convert')
  .option('-o, --output <file>', 'output file')
  .option('--bullet-list-marker <marker>', '"-", "+", or "*"')
  .option('--code-block-style <style>', '"indented" or "fenced"')
  .option('--em-delimiter <delimiter>', '"_" or "*"')
  .option('--fence <fence>', '"```" or "~~~"')
  .option('--heading-style <style>', '"setext" or "atx"')
  .option('--hr <hr>', 'any thematic break')
  .option('--link-style <style>', '"inlined" or "referenced"')
  .option('--link-reference-style <style>', '"full", "collapsed", or "shortcut"')
  .option('--strong-delimiter <delimiter>', '"**" or "__"')
  .parse(process.argv)

var stdin = ''
if (process.stdin.isTTY) {
  if (program.move) {
    if (!program.input) program.input = program.args[0]
    console.log('Move!', program.input)
    console.assert(program.input && program.input.endsWith('.html'))
    program.output = program.input.replace(/\.html$/, '.md')
  }
  turndown(program.input || program.args[0], program.yaml)
} else {
  process.stdin.on('readable', function () {
    var chunk = this.read()
    if (chunk !== null) stdin += chunk
  })
  process.stdin.on('end', function () {
    turndown(stdin)
  })
}

function turndown (string, skipYaml) {
  var turndownService = new TurndownService(options())

  if (fs.existsSync(string)) {
    fs.readFile(string, 'utf8', function (error, contents) {
      if (error) throw error
      let prefix = '';
      if (skipYaml) {
        let match = /^---\n(.*\n)+?---\n/.exec(contents);
        if (match) {
          prefix = match[0];
          contents = contents.substring(prefix.length);
        }
      }
      output(prefix + turndownService.turndown(contents))
    })
  } else {
    output(turndownService.turndown(string))
  }
}

function output (markdown) {
  if (program.output) {
    fs.writeFile(program.output, markdown, 'utf8', function (error) {
      if (error) throw error
      console.log(program.output)
      if (program.move) {
        console.log('removing:', program.input)
        fs.unlinkSync(program.input)
      }
    })
  } else {
    console.log(markdown)
  }
}

function options () {
  var opts = {}
  for (var i = 0; i < program.options.length; i++) {
    var optionName = optionNameFromFlag(program.options[i].long)
    if (program[optionName]) opts[optionName] = program[optionName]
  }
  delete opts.version
  delete opts.input
  delete opts.output
  return opts
}

function optionNameFromFlag (flag) {
  return flag.replace(/^--/, '').replace(/-([a-z])/g, function (match, char) {
    return char.toUpperCase()
  })
}
