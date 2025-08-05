import { NextRequest, NextResponse } from 'next/server';
import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

// Define interfaces for the node and edge types
interface NodeData {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
}

interface EdgeData {
  id: string;
  source: string;
  target: string;
}

// Define the schema for flow diff
const FlowDiffSchema = z.object({
  action: z.enum(['add_node', 'delete_node', 'update_node', 'add_edge', 'delete_edge', 'clear_all', 'explain']),
  nodeId: z.string().optional(),
  nodeType: z.enum(['dataSource', 'aiModel', 'action']).optional(),
  nodeLabel: z.string().optional(),
  nodePosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  sourceId: z.string().optional(),
  targetId: z.string().optional(),
  edgeId: z.string().optional(),
  explanation: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, currentNodes = [], currentEdges = [] }: {
      prompt: string;
      currentNodes?: NodeData[];
      currentEdges?: EdgeData[];
    } = await request.json();
    
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ 
        error: 'GROQ_API_KEY not configured',
        response: 'Please configure your GROQ API key in the environment variables.' 
      }, { status: 500 });
    }

    // Initialize Groq with a model that follows instructions well
    const model = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      model: 'moonshotai/kimi-k2-instruct', // Better at following JSON output format
      temperature: 0.1, // Lower temperature for more consistent outputs
    });

    // Create context about current flow state
    const flowContext = currentNodes.length > 0 ? `
    
Current Flow State:
Nodes:
${currentNodes.map((node: NodeData) => `- ${node.id}: "${node.label}" (type: ${node.type})`).join('\n')}

Edges:
${currentEdges.map((edge: EdgeData) => `- ${edge.source} → ${edge.target}`).join('\n')}

When referencing nodes for connections, you can use:
- Node IDs: ${currentNodes.map((n: NodeData) => n.id).join(', ')}
- Node labels: ${currentNodes.map((n: NodeData) => `"${n.label}"`).join(', ')}
- Node types: ${[...new Set(currentNodes.map((n: NodeData) => n.type))].join(', ')}
` : '\nCurrent Flow State: Empty (no nodes or edges)';

    // Create the prompt template
    const promptTemplate = ChatPromptTemplate.fromTemplate(`
You are an AI assistant for a flow builder application. Analyze the user's instruction and determine what action to take.
${flowContext}

Available actions:
- add_node: Add a new node (types: dataSource, aiModel, action)
- delete_node: Delete an existing node by ID or label
- add_edge: Connect two nodes by their IDs or labels
- delete_edge: Remove a connection by edge ID or by source/target references
- clear_all: Clear the entire flow
- explain: Explain what the flow does

Examples:
- "Add a data source node" → {{"action": "add_node", "nodeType": "dataSource", "nodeLabel": "Data Source", "nodePosition": {{"x": 200, "y": 150}}}}
- "Add an AI model node called GPT-4" → {{"action": "add_node", "nodeType": "aiModel", "nodeLabel": "GPT-4", "nodePosition": {{"x": 400, "y": 150}}}}
- "Connect Data Source to GPT-4" → {{"action": "add_edge", "sourceId": "Data Source", "targetId": "GPT-4"}}
- "Connect node 1 to node 2" → {{"action": "add_edge", "sourceId": "1", "targetId": "2"}}
- "Delete the GPT-4 node" → {{"action": "delete_node", "nodeId": "GPT-4"}}
- "Delete node 3" → {{"action": "delete_node", "nodeId": "3"}}
- "Remove connection between A and B" → {{"action": "delete_edge", "sourceId": "A", "targetId": "B"}}
- "Clear everything" → {{"action": "clear_all"}}

IMPORTANT RULES:
1. When connecting nodes, use the exact node IDs or labels provided in the current flow state
2. If user says "connect A to B", use A as sourceId and B as targetId
3. You can reference nodes by their ID, label, or type
4. For new nodes, choose appropriate positions (spread them out)
5. Respond ONLY with valid JSON - no explanations outside the JSON

User instruction: {instruction}

IMPORTANT: Respond ONLY with a valid JSON object. Do not include any explanation or text outside the JSON. The response must start with {{ and end with }}.
`);

    // Execute the chain
    let result;
    try {
      // First try with the chain
      const formattedPrompt = await promptTemplate.format({ instruction: prompt });
      const rawResponse = await model.invoke(formattedPrompt);
      const content = typeof rawResponse.content === 'string' ? rawResponse.content : String(rawResponse.content);
      
      // Remove content between <think> tags
      let cleanedContent = content;
      const thinkRegex = /<think>[\s\S]*?<\/think>/g;
      cleanedContent = cleanedContent.replace(thinkRegex, '').trim();
      
      // Try to parse the cleaned content as JSON
      if (cleanedContent.startsWith('{') && cleanedContent.endsWith('}')) {
        result = JSON.parse(cleanedContent);
      } else {
        // If not pure JSON, try to extract JSON from the content
        const jsonMatch = cleanedContent.match(/{[^{}]*(?:{[^{}]*}[^{}]*)*}/g);
        if (jsonMatch && jsonMatch.length > 0) {
          // Try each match to find valid JSON
          for (const match of jsonMatch) {
            try {
              result = JSON.parse(match);
              break;
            } catch {
              continue;
            }
          }
        }
        
        if (!result) {
          throw new Error('No valid JSON found in response');
        }
      }
    } catch (error: unknown) {
      console.error('Error processing AI response:', error);
      
      // Fallback: Try a simpler prompt
      const fallbackResponse = await model.invoke(`
        Return ONLY a JSON object for this instruction: "${prompt}"
        
        Examples:
        - Add node: {"action": "add_node", "nodeType": "dataSource", "nodeLabel": "New Node", "nodePosition": {"x": 300, "y": 200}}
        - Delete node: {"action": "delete_node", "nodeId": "1"}
        - Connect nodes: {"action": "add_edge", "sourceId": "1", "targetId": "2"}
        
        JSON:
      `);
      
      const fallbackContent = typeof fallbackResponse.content === 'string' ? fallbackResponse.content : String(fallbackResponse.content);
      // Remove think tags from fallback too
      const cleanedFallback = fallbackContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      try {
        result = JSON.parse(cleanedFallback);
      } catch {
        // Last resort: create a default response
        result = {
          action: 'explain',
          explanation: 'I understood your request but had trouble processing it. Please try rephrasing.'
        };
      }
    }

    // Validate the result against our schema
    try {
      const validatedResult = FlowDiffSchema.parse(result);
      
      // Generate a human-readable response
      let response = '';
      switch (validatedResult.action) {
        case 'add_node':
          response = `I'll add a ${validatedResult.nodeType} node labeled "${validatedResult.nodeLabel}" to your flow.`;
          break;
        case 'delete_node':
          response = `I'll delete the node from your flow.`;
          break;
        case 'add_edge':
          response = `I'll connect the nodes for you.`;
          break;
        case 'clear_all':
          response = `I'll clear all nodes and connections from your flow.`;
          break;
        case 'explain':
          response = validatedResult.explanation || 'This flow processes data through various stages.';
          break;
        default:
          response = `I'll ${validatedResult.action.replace('_', ' ')} as requested.`;
      }

      return NextResponse.json({ 
        response,
        flowDiff: validatedResult 
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json({ 
        response: "I understood your request but couldn't generate a valid action. Please try rephrasing.",
        error: 'Invalid response format'
      });
    }

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      response: 'Sorry, I encountered an error while processing your request. Please try again.' 
    }, { status: 500 });
  }
}
