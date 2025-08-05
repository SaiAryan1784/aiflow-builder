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

// Define the schema for individual flow operations
const FlowOperationSchema = z.object({
  action: z.enum(['add_node', 'delete_node', 'update_node', 'add_edge', 'delete_edge', 'clear_all']),
  nodeId: z.string().optional(),
  nodeType: z.enum(['action']).optional(), // Only support universal 'action' type
  nodeLabel: z.string().optional(),
  nodePosition: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  sourceId: z.string().optional(),
  targetId: z.string().optional(),
  edgeId: z.string().optional(),
  updateData: z.object({
    label: z.string().optional(),
    type: z.enum(['action']).optional(), // Only support universal 'action' type
    position: z.object({
      x: z.number(),
      y: z.number(),
    }).optional(),
  }).optional(),
});

// Define the schema for flow diff (can be single operation or multiple)
const FlowDiffSchema = z.object({
  type: z.enum(['single', 'multiple', 'explain']),
  operations: z.array(FlowOperationSchema).optional(),
  operation: FlowOperationSchema.optional(),
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
You are an AI assistant for a flow builder application. Analyze the user's instruction and determine what action(s) to take.
${flowContext}

IMPORTANT: This flow builder uses UNIVERSAL NODES only. All nodes have type "action" regardless of their purpose (data source, AI model, action, etc.). The node's purpose is defined by its LABEL, not its type.

Available actions:
- add_node: Add a new universal node (always use nodeType: "action")
- delete_node: Delete an existing node by ID or label
- update_node: Update an existing node's properties
- add_edge: Connect two nodes by their IDs or labels
- delete_edge: Remove a connection by edge ID or by source/target references
- clear_all: Clear the entire flow

Response Types:
1. SINGLE operation: {{"type": "single", "operation": {{"action": "add_node", "nodeType": "action", "nodeLabel": "Data Source", "nodePosition": {{"x": 200, "y": 150}}}}}}

2. MULTIPLE operations: {{"type": "multiple", "operations": [{{"action": "add_node", "nodeType": "action", "nodeLabel": "CSV Reader", "nodePosition": {{"x": 100, "y": 100}}}}, {{"action": "add_node", "nodeType": "action", "nodeLabel": "GPT-4", "nodePosition": {{"x": 300, "y": 100}}}}, {{"action": "add_edge", "sourceId": "CSV Reader", "targetId": "GPT-4"}}]}}

3. EXPLAIN flow: {{"type": "explain", "explanation": "This flow reads data from a CSV file, processes it through GPT-4 AI model, and outputs the results. The data flows from the CSV Reader to GPT-4 for natural language processing."}}

4. UPDATE node: {{"type": "single", "operation": {{"action": "update_node", "nodeId": "existing-node-id", "updateData": {{"label": "New Label", "position": {{"x": 400, "y": 200}}}}}}}}

Examples for different user requests:

Single operations:
- "Add a data source node" → {{"type": "single", "operation": {{"action": "add_node", "nodeType": "action", "nodeLabel": "Data Source", "nodePosition": {{"x": 200, "y": 150}}}}}}
- "Add dataSource node1" → {{"type": "single", "operation": {{"action": "add_node", "nodeType": "action", "nodeLabel": "node1", "nodePosition": {{"x": 200, "y": 150}}}}}}
- "Add aiModel node2" → {{"type": "single", "operation": {{"action": "add_node", "nodeType": "action", "nodeLabel": "node2", "nodePosition": {{"x": 350, "y": 150}}}}}}
- "Add action node3" → {{"type": "single", "operation": {{"action": "add_node", "nodeType": "action", "nodeLabel": "node3", "nodePosition": {{"x": 500, "y": 150}}}}}}
- "Delete the GPT-4 node" → {{"type": "single", "operation": {{"action": "delete_node", "nodeId": "GPT-4"}}}}
- "Update node1 label to Processing Engine" → {{"type": "single", "operation": {{"action": "update_node", "nodeId": "node1", "updateData": {{"label": "Processing Engine"}}}}}}

Multiple operations:
- "Add CSV reader, GPT-4 model and connect them" → {{"type": "multiple", "operations": [{{"action": "add_node", "nodeType": "action", "nodeLabel": "CSV Reader", "nodePosition": {{"x": 100, "y": 150}}}}, {{"action": "add_node", "nodeType": "action", "nodeLabel": "GPT-4", "nodePosition": {{"x": 350, "y": 150}}}}, {{"action": "add_edge", "sourceId": "CSV Reader", "targetId": "GPT-4"}}]}}
- "Add dataSource 'node1', add aiModel 'node2', add action 'node3'" → {{"type": "multiple", "operations": [{{"action": "add_node", "nodeType": "action", "nodeLabel": "node1", "nodePosition": {{"x": 100, "y": 150}}}}, {{"action": "add_node", "nodeType": "action", "nodeLabel": "node2", "nodePosition": {{"x": 300, "y": 150}}}}, {{"action": "add_node", "nodeType": "action", "nodeLabel": "node3", "nodePosition": {{"x": 500, "y": 150}}}}]}}
- "Delete nodes A and B and add new action node" → {{"type": "multiple", "operations": [{{"action": "delete_node", "nodeId": "A"}}, {{"action": "delete_node", "nodeId": "B"}}, {{"action": "add_node", "nodeType": "action", "nodeLabel": "New Action", "nodePosition": {{"x": 200, "y": 200}}}}]}}
- "Update node1 to Data Reader and node2 to AI Processor" → {{"type": "multiple", "operations": [{{"action": "update_node", "nodeId": "node1", "updateData": {{"label": "Data Reader"}}}}, {{"action": "update_node", "nodeId": "node2", "updateData": {{"label": "AI Processor"}}}}]}}
- "Update node3 to node6 and node5 to node7" → {{"type": "multiple", "operations": [{{"action": "update_node", "nodeId": "node3", "updateData": {{"label": "node6"}}}}, {{"action": "update_node", "nodeId": "node5", "updateData": {{"label": "node7"}}}}]}}

Flow explanation:
- "Explain what this flow does" → {{"type": "explain", "explanation": "This flow creates a data processing pipeline where [detailed explanation based on current nodes and connections]"}}

CRITICAL RULES:
1. ALWAYS use "nodeType": "action" for ALL nodes - never use dataSource, aiModel, or any other type
2. The node's function (data source, AI model, action) is determined by its LABEL, not its type
3. For multiple operations (like "add 3 nodes", "connect A to B and B to C", "update node1 and node2"), use type: "multiple"
4. For single operations, use type: "single"
5. When user mentions multiple nodes with "and" or lists multiple actions, use type: "multiple"
6. For explanations, analyze the current flow and provide detailed explanation
7. When connecting nodes, use the exact node IDs or labels from current flow state
8. For new nodes, space them out appropriately (x: 100-500, y: 100-300)
9. When updating nodes, only include fields that should be changed in updateData
10. If user says "update X to Y and A to B", create two separate update_node operations

User instruction: {instruction}

IMPORTANT: Respond ONLY with valid JSON. No explanations outside the JSON. Start with curly brace and end with curly brace.
`);

    // Execute the chain
    let result;
    try {
      // First try with the chain
      const formattedPrompt = await promptTemplate.format({ instruction: prompt });
      const rawResponse = await model.invoke(formattedPrompt);
      const content = typeof rawResponse.content === 'string' ? rawResponse.content : JSON.stringify(rawResponse.content);
      
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
        - Add node: {"type": "single", "operation": {"action": "add_node", "nodeType": "dataSource", "nodeLabel": "New Node", "nodePosition": {"x": 300, "y": 200}}}
        - Delete node: {"type": "single", "operation": {"action": "delete_node", "nodeId": "1"}}
        - Connect nodes: {"type": "single", "operation": {"action": "add_edge", "sourceId": "1", "targetId": "2"}}
        - Multiple operations: {"type": "multiple", "operations": [{"action": "add_node", "nodeType": "dataSource", "nodeLabel": "Node1", "nodePosition": {"x": 100, "y": 100}}, {"action": "add_node", "nodeType": "aiModel", "nodeLabel": "Node2", "nodePosition": {"x": 300, "y": 100}}]}
        
        JSON:
      `);
      
      const fallbackContent = typeof fallbackResponse.content === 'string' ? fallbackResponse.content : JSON.stringify(fallbackResponse.content);
      // Remove think tags from fallback too
      const cleanedFallback = fallbackContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      
      try {
        result = JSON.parse(cleanedFallback);
      } catch {
        // Last resort: create a default response
        result = {
          type: 'explain',
          explanation: 'I understood your request but had trouble processing it. Please try rephrasing.'
        };
      }
    }

    // Validate the result against our schema
    try {
      const validatedResult = FlowDiffSchema.parse(result);
      
      // Generate a human-readable response
      let response = '';
      
      if (validatedResult.type === 'explain') {
        // Generate detailed flow explanation
        if (currentNodes.length === 0) {
          response = 'Your flow is currently empty. You can start by adding nodes like data sources, AI models, or action nodes to create a processing pipeline.';
        } else {
          let explanation = validatedResult.explanation || '';
          
          // If no explanation provided by AI, generate one based on flow structure
          if (!explanation) {
            const nodeTypes = {
              dataSource: currentNodes.filter(n => n.type === 'dataSource'),
              aiModel: currentNodes.filter(n => n.type === 'aiModel'),
              action: currentNodes.filter(n => n.type === 'action')
            };
            
            explanation = `This flow contains ${currentNodes.length} node(s): `;
            const typeCounts = [];
            if (nodeTypes.dataSource.length > 0) typeCounts.push(`${nodeTypes.dataSource.length} data source(s)`);
            if (nodeTypes.aiModel.length > 0) typeCounts.push(`${nodeTypes.aiModel.length} AI model(s)`);
            if (nodeTypes.action.length > 0) typeCounts.push(`${nodeTypes.action.length} action(s)`);
            
            explanation += typeCounts.join(', ') + '. ';
            
            if (currentEdges.length > 0) {
              explanation += `There are ${currentEdges.length} connection(s) forming a processing pipeline. `;
              explanation += `The data flows: ${currentEdges.map(edge => {
                const sourceNode = currentNodes.find(n => n.id === edge.source);
                const targetNode = currentNodes.find(n => n.id === edge.target);
                return `${sourceNode?.label || edge.source} → ${targetNode?.label || edge.target}`;
              }).join(', ')}.`;
            } else {
              explanation += 'The nodes are not yet connected. You can connect them to create a data processing pipeline.';
            }
          }
          
          response = explanation;
        }
      } else if (validatedResult.type === 'multiple') {
        const operations = validatedResult.operations || [];
        response = `I'll perform ${operations.length} operations: `;
        const operationDescriptions = operations.map(op => {
          switch (op.action) {
            case 'add_node': return `add ${op.nodeType} "${op.nodeLabel}"`;
            case 'delete_node': return `delete node "${op.nodeId}"`;
            case 'update_node': return `update node "${op.nodeId}"`;
            case 'add_edge': return `connect "${op.sourceId}" to "${op.targetId}"`;
            case 'delete_edge': return `remove connection`;
            default: return op.action;
          }
        });
        response += operationDescriptions.join(', ') + '.';
      } else if (validatedResult.type === 'single' && validatedResult.operation) {
        const op = validatedResult.operation;
        switch (op.action) {
          case 'add_node':
            response = `I'll add a ${op.nodeType} node labeled "${op.nodeLabel}" to your flow.`;
            break;
          case 'delete_node':
            response = `I'll delete the "${op.nodeId}" node from your flow.`;
            break;
          case 'update_node':
            response = `I'll update the "${op.nodeId}" node with the new properties.`;
            break;
          case 'add_edge':
            response = `I'll connect "${op.sourceId}" to "${op.targetId}".`;
            break;
          case 'delete_edge':
            response = `I'll remove the connection.`;
            break;
          case 'clear_all':
            response = `I'll clear all nodes and connections from your flow.`;
            break;
          default:
            response = `I'll perform the requested action.`;
            break;
        }
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
