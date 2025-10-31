import {parseArgs} from 'util';
import { JSDOM } from 'jsdom';
import { select } from '@inquirer/prompts';
import ora from 'ora';


function tokenize(bodyChildren) {
	const tokens = [];
	for(const child of bodyChildren) {
		if (child.classList.contains('mw-heading2')) {
			const element = { type: 'title', content: child.textContent }; 
			tokens.push(element);
		}
		if (child.classList.contains('excerpt-block')) {
			const excerpt = child.querySelector('div.excerpt');
			const excerptChildren = excerpt.children;
			for(const exChild of excerptChildren) {
				if (exChild.nodeName == 'P') {
					const element = { type: 'paragraph', content: exChild.textContent };
					tokens.push(element);
				}
			}

		}
		if (child.nodeName == 'P') {
			const element = { type: 'paragraph', content: child.textContent };
			tokens.push(element);
		}
	}
	return tokens;
}

function parse(tokens) {
	const article = { 'Intro': [] };
	let title = 'Intro';
	for(const el of tokens) {
		if(el.type == 'title') {
			title = el.content;
			article[title] = [];	
		}
		if(el.type == 'paragraph') {
			article[title].push(el.content);
		}
	}
	return article;
}


async function main() {
	const spinner = ora('Obteniendo articulo...').start();
	const wikiurl = "https://es.wikipedia.org/wiki/";
	try {
		const {values, _} = parseArgs({
			args: Bun.argv,
			options: {
				url: { type: 'string' }	
			},
			strict: true,
			allowPositionals: true
			
		});
		const response = await fetch(wikiurl + values.url);
		const html = await response.text();
		const dom = new JSDOM(html);
		const body = dom.window.document.querySelector("div.mw-content-ltr");
		const bodyChildren = body.children;
		const tokens = tokenize(bodyChildren);
		const article = parse(tokens);	
		spinner.stop();	
		const segments = Object.keys(article).map(e => ({name:e , value:e}));
		const answer = await select({
			message: 'que parte te gustaria leer?',
			choices: segments
		});	
		
		for(const p of article[answer]) {
			console.log(p);
		}		


	}catch(error) {
		if(error.code == "ERR_PARSE_ARGS_INVALID_OPTION_VALUE") {
			console.error("argumentos invalidos.");	
		} else {

			console.error(error);	
		}
	}
}


await main();





